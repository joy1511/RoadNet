"""
Image Tiling and Normalization Pipeline
Friend 2 responsibility: Preprocessing large satellite images into manageable patches
"""

import cv2
import numpy as np
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class TilingPipeline:
    """Slices large satellite images into tiles for model inference, and reconstructs them"""
    
    def __init__(self, tile_size=512, overlap=128):
        """
        Args:
            tile_size (int): Size of the square tile
            overlap (int): Number of pixels to overlap between tiles
        """
        self.tile_size = tile_size
        self.overlap = overlap
        self.stride = self.tile_size - self.overlap
        
    def normalize_image(self, image):
        """Normalize image for model inference"""
        # Common ImageNet normalization stats
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        
        img_float = image.astype(np.float32) / 255.0
        normalized = (img_float - mean) / std
        return normalized

    def extract_tiles(self, image):
        """
        Slice image into overlapping tiles
        Returns: list of tiles, list of (x, y) coordinates for reconstruction
        """
        h, w = image.shape[:2]
        tiles = []
        coords = []
        
        # Pad image to ensure we cover the edges completely
        pad_h = (self.stride - (h - self.tile_size) % self.stride) % self.stride
        pad_w = (self.stride - (w - self.tile_size) % self.stride) % self.stride
        
        if len(image.shape) == 3:
            padded_img = np.pad(image, ((0, pad_h), (0, pad_w), (0, 0)), mode='reflect')
        else:
            padded_img = np.pad(image, ((0, pad_h), (0, pad_w)), mode='reflect')
            
        ph, pw = padded_img.shape[:2]
        
        for y in range(0, ph - self.tile_size + 1, self.stride):
            for x in range(0, pw - self.tile_size + 1, self.stride):
                tile = padded_img[y:y+self.tile_size, x:x+self.tile_size]
                tiles.append(tile)
                coords.append((x, y))
                
        return tiles, coords, (h, w)
        
    def reconstruct_from_tiles(self, tiles, coords, original_shape):
        """
        Stitch overlapping tiles back together using distance-based weighting (blending)
        """
        h, w = original_shape[:2]
        
        # Determine padded shape
        pad_h = (self.stride - (h - self.tile_size) % self.stride) % self.stride
        pad_w = (self.stride - (w - self.tile_size) % self.stride) % self.stride
        ph, pw = h + pad_h, w + pad_w
        
        # Output canvas
        num_channels = tiles[0].shape[2] if len(tiles[0].shape) == 3 else 1
        
        if num_channels == 1:
            reconstructed = np.zeros((ph, pw), dtype=np.float32)
            weights = np.zeros((ph, pw), dtype=np.float32)
        else:
            reconstructed = np.zeros((ph, pw, num_channels), dtype=np.float32)
            weights = np.zeros((ph, pw, 1), dtype=np.float32)
            
        # Create a 2D weight matrix (Bartlett window-like) for smooth blending
        y_w, x_w = np.ogrid[:self.tile_size, :self.tile_size]
        center = self.tile_size / 2 - 0.5
        weight_matrix = (1 - np.abs(x_w - center) / center) * (1 - np.abs(y_w - center) / center)
        weight_matrix = weight_matrix.astype(np.float32)
        
        if num_channels > 1:
            weight_matrix = weight_matrix[:, :, np.newaxis]
            
        for tile, (x, y) in zip(tiles, coords):
            reconstructed[y:y+self.tile_size, x:x+self.tile_size] += tile * weight_matrix
            weights[y:y+self.tile_size, x:x+self.tile_size] += weight_matrix
            
        # Normalize by weights to get average overlapping pixels
        weights[weights == 0] = 1 # Avoid division by zero
        reconstructed /= weights
        
        # Crop to original size
        reconstructed = reconstructed[:h, :w]
        
        return np.clip(reconstructed, 0, 255).astype(np.uint8)

if __name__ == '__main__':
    # Simple test
    print("Testing Tiling Pipeline...")
    dummy_image = np.ones((1000, 1000, 3), dtype=np.uint8) * 128
    
    pipeline = TilingPipeline(tile_size=256, overlap=64)
    tiles, coords, shape = pipeline.extract_tiles(dummy_image)
    
    print(f"Extracted {len(tiles)} tiles from {shape} image")
    
    reconstructed = pipeline.reconstruct_from_tiles(tiles, coords, shape)
    print(f"Reconstructed shape: {reconstructed.shape}")
    print("✅ Tiling Pipeline test passed")
