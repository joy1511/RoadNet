"""
Segmentation API - HuggingFace Model Integration
Friend 1 + 2 responsibilities: Road extraction with occlusion handling
"""

import torch
import torch.nn as nn
import numpy as np
import cv2
from PIL import Image
from pathlib import Path
import logging
from huggingface_hub import hf_hub_download
import segmentation_models_pytorch as smp
import albumentations as A
from albumentations.pytorch import ToTensorV2

from config import config

logger = logging.getLogger(__name__)


class SegmentationAPI:
    """
    Production-ready segmentation API with HuggingFace integration
    Handles road extraction from satellite imagery with occlusion robustness
    """
    
    def __init__(self, model_path=None):
        """
        Initialize segmentation API
        
        Args:
            model_path: Local path to model weights (if not using HuggingFace)
        """
        self.device = config.DEVICE
        self.threshold = config.SEGMENTATION_THRESHOLD
        
        logger.info(f"Initializing Segmentation API on device: {self.device}")
        
        # Load model
        self.model = self._load_model(model_path)
        self.model.eval()
        
        # Setup preprocessing
        self.transform = self._get_transform()
        
        logger.info("✅ Segmentation API initialized successfully")
    
    def _load_model(self, model_path=None):
        """Load model from HuggingFace or local path"""
        try:
            if model_path and Path(model_path).exists():
                # Load from local path
                logger.info(f"Loading model from local path: {model_path}")
                model = self._create_model_architecture()
                state_dict = torch.load(model_path, map_location=self.device)
                model.load_state_dict(state_dict)
                
            elif config.HUGGINGFACE_TOKEN and config.HF_SEGMENTATION_MODEL:
                # Download from HuggingFace
                logger.info(f"Downloading model from HuggingFace: {config.HF_SEGMENTATION_MODEL}")
                
                try:
                    model_file = hf_hub_download(
                        repo_id=config.HF_SEGMENTATION_MODEL,
                        filename="best_model.pth",
                        token=config.HUGGINGFACE_TOKEN
                    )
                    
                    model = self._create_model_architecture()
                    state_dict = torch.load(model_file, map_location=self.device)
                    model.load_state_dict(state_dict)
                    
                    logger.info("✅ Model downloaded from HuggingFace")
                    
                except Exception as e:
                    logger.warning(f"Failed to download from HuggingFace: {e}")
                    logger.warning("Falling back to ImageNet pre-trained encoder")
                    model = self._create_model_architecture()
            
            else:
                # Use ImageNet pre-trained weights only
                logger.warning("No custom weights found. Using ImageNet pre-trained encoder")
                logger.warning("For better results, train a model and upload to HuggingFace")
                model = self._create_model_architecture()
            
            return model.to(self.device)
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def _create_model_architecture(self):
        """Initialize base model architecture"""
        model = smp.DeepLabV3Plus(
            encoder_name="resnet50",
            encoder_weights="imagenet",
            in_channels=3,
            classes=1,
            activation=None  # We'll apply sigmoid manually
        )
        return model
    
    def _get_transform(self):
        """No longer used, handled manually in preprocess"""
        pass
    
    def preprocess(self, image):
        """
        Preprocess image for model input
        """
        # Load image if path
        if isinstance(image, (str, Path)):
            image = Image.open(image).convert('RGB')
        
        # Convert to numpy if PIL
        if isinstance(image, Image.Image):
            original_size = image.size  # (width, height)
            image = np.array(image)
        else:
            original_size = (image.shape[1], image.shape[0])
        
        # Ensure RGB
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
            
        h, w = image.shape[:2]
        max_dim = max(h, w)
        
        # 1. Resize so longest edge is MAX_IMAGE_SIZE (only if downsizing)
        if max_dim > config.MAX_IMAGE_SIZE:
            scale = config.MAX_IMAGE_SIZE / max_dim
            new_w, new_h = int(w * scale), int(h * scale)
            image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
            
        intermediate_size = (image.shape[1], image.shape[0])
        
        # 2. Pad to make divisible by 32 and at least 512x512
        h, w = image.shape[:2]
        pad_h = (32 - h % 32) % 32
        pad_w = (32 - w % 32) % 32
        
        if h + pad_h < 512:
            pad_h += 512 - (h + pad_h)
        if w + pad_w < 512:
            pad_w += 512 - (w + pad_w)
            
        if pad_h > 0 or pad_w > 0:
            image = cv2.copyMakeBorder(image, 0, pad_h, 0, pad_w, cv2.BORDER_CONSTANT, value=[0, 0, 0])
            
        # 3. Normalize
        image = image.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        image = (image - mean) / std
        
        # 4. To Tensor
        image_tensor = torch.from_numpy(image.transpose(2, 0, 1)).unsqueeze(0).float()
        
        return image_tensor.to(self.device), {'original_size': original_size, 'intermediate_size': intermediate_size}
    
    def postprocess(self, output, sizes, threshold=None):
        """
        Postprocess model output
        """
        if threshold is None:
            threshold = self.threshold
        
        # Apply sigmoid and threshold
        output = torch.sigmoid(output)
        mask = (output > threshold).float()
        
        # Convert to numpy
        mask = mask.squeeze().cpu().numpy()
        mask = (mask * 255).astype(np.uint8)
        
        # Crop padding
        intermediate_w, intermediate_h = sizes['intermediate_size']
        mask = mask[:intermediate_h, :intermediate_w]
        
        # Resize to original size
        original_w, original_h = sizes['original_size']
        if (intermediate_w, intermediate_h) != (original_w, original_h):
            mask = cv2.resize(mask, (original_w, original_h), interpolation=cv2.INTER_NEAREST)
        
        return Image.fromarray(mask)
    
    def segment(self, image, threshold=None, handle_occlusion=False, return_format='image'):
        """
        Segment roads from satellite image
        
        Args:
            image: Input image (PIL, numpy, or file path)
            threshold: Confidence threshold (default: from config)
            handle_occlusion: Whether to apply occlusion-robust processing
            return_format: 'image', 'numpy', or 'both'
            
        Returns:
            Binary road mask in requested format
        """
        if threshold is None:
            threshold = self.threshold
        
        # Preprocess
        image_tensor, original_size = self.preprocess(image)
        
        # Inference
        with torch.no_grad():
            output = self.model(image_tensor)
        
        # Postprocess
        mask = self.postprocess(output, original_size, threshold=threshold)
        
        # Apply occlusion handling if requested
        if handle_occlusion:
            mask = self._apply_occlusion_robustness(mask)
        
        # Compute stats
        mask_np = np.array(mask)
        total_pixels = mask_np.size
        road_pixels = np.sum(mask_np > 0)
        road_percentage = (road_pixels / total_pixels) * 100
        
        stats = {
            'total_pixels': int(total_pixels),
            'road_pixels': int(road_pixels),
            'road_percentage': float(road_percentage),
            'image_size': original_size,
            'threshold_used': threshold
        }
        
        # Return in requested format
        if return_format == 'image':
            return {'mask': mask, 'stats': stats}
        elif return_format == 'numpy':
            return {'mask': mask_np, 'stats': stats}
        elif return_format == 'both':
            return {'mask': mask, 'mask_numpy': mask_np, 'stats': stats}
        else:
            raise ValueError(f"Unknown return_format: {return_format}")
    
    def _apply_occlusion_robustness(self, mask):
        """
        Apply post-processing for occlusion robustness
        Friend 2 responsibility: Handling difficult occlusion cases
        
        Args:
            mask: Binary mask (PIL Image)
            
        Returns:
            Enhanced mask
        """
        mask_np = np.array(mask)
        
        # 1. Morphological closing to fill small gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask_np = cv2.morphologyEx(mask_np, cv2.MORPH_CLOSE, kernel)
        
        # 2. Remove small isolated regions (noise)
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            mask_np, connectivity=8
        )
        
        # Keep only components larger than minimum size
        min_size = 100  # pixels
        mask_filtered = np.zeros_like(mask_np)
        
        for i in range(1, num_labels):  # Skip background (label 0)
            if stats[i, cv2.CC_STAT_AREA] >= min_size:
                mask_filtered[labels == i] = 255
        
        # 3. Smooth boundaries
        mask_filtered = cv2.GaussianBlur(mask_filtered, (3, 3), 0)
        mask_filtered = (mask_filtered > 127).astype(np.uint8) * 255
        
        return Image.fromarray(mask_filtered)
    
    def batch_segment(self, images, threshold=None, handle_occlusion=False):
        """
        Segment multiple images in batch
        
        Args:
            images: List of images
            threshold: Confidence threshold
            handle_occlusion: Apply occlusion handling
            
        Returns:
            List of masks and stats
        """
        results = []
        
        for img in images:
            result = self.segment(
                img,
                threshold=threshold,
                handle_occlusion=handle_occlusion,
                return_format='both'
            )
            results.append(result)
        
        return results
    
    def evaluate_metrics(self, pred_mask, gt_mask):
        """
        Evaluate segmentation metrics
        Friend 2 responsibility: Evaluation metrics
        
        Args:
            pred_mask: Predicted mask (numpy array)
            gt_mask: Ground truth mask (numpy array)
            
        Returns:
            Dictionary of metrics
        """
        # Ensure binary
        pred_mask = (pred_mask > 127).astype(np.uint8)
        gt_mask = (gt_mask > 127).astype(np.uint8)
        
        # Flatten
        pred_flat = pred_mask.flatten()
        gt_flat = gt_mask.flatten()
        
        # Compute metrics
        intersection = np.sum(pred_flat * gt_flat)
        union = np.sum(pred_flat) + np.sum(gt_flat) - intersection
        
        iou = intersection / (union + 1e-7)
        dice = (2 * intersection) / (np.sum(pred_flat) + np.sum(gt_flat) + 1e-7)
        
        # Pixel accuracy
        correct = np.sum(pred_flat == gt_flat)
        total = pred_flat.size
        pixel_accuracy = correct / total
        
        # Precision and Recall
        tp = intersection
        fp = np.sum(pred_flat) - intersection
        fn = np.sum(gt_flat) - intersection
        
        precision = tp / (tp + fp + 1e-7)
        recall = tp / (tp + fn + 1e-7)
        f1_score = 2 * (precision * recall) / (precision + recall + 1e-7)
        
        return {
            'iou': float(iou),
            'dice': float(dice),
            'pixel_accuracy': float(pixel_accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1_score)
        }


if __name__ == '__main__':
    # Test the API
    print("Testing Segmentation API...")
    
    api = SegmentationAPI()
    
    print("✅ API initialized successfully")
    print(f"Device: {api.device}")
    print(f"Threshold: {api.threshold}")
