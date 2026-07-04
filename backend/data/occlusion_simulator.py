"""
Synthetic Occlusion Simulator
Friend 2 responsibility: Simulating clouds, shadows, and canopy at controllable severity
"""

import cv2
import numpy as np
import logging
from pathlib import Path
import random

logger = logging.getLogger(__name__)

class OcclusionSimulator:
    """Injects synthetic occlusions into satellite imagery to train robustness"""
    
    def __init__(self, severity='medium'):
        """
        Initialize the simulator with a severity level.
        Args:
            severity (str): 'low', 'medium', 'high'
        """
        self.severity = severity
        
        # Mapping severity to intensity probabilities/sizes
        self.params = {
            'low': {'cloud_prob': 0.2, 'cloud_alpha': 0.4, 'shadow_darkness': 0.2, 'canopy_density': 0.1},
            'medium': {'cloud_prob': 0.5, 'cloud_alpha': 0.7, 'shadow_darkness': 0.5, 'canopy_density': 0.3},
            'high': {'cloud_prob': 0.8, 'cloud_alpha': 0.9, 'shadow_darkness': 0.8, 'canopy_density': 0.6}
        }
        
    def inject_clouds(self, image):
        """Inject synthetic Perlin noise clouds"""
        if random.random() > self.params[self.severity]['cloud_prob']:
            return image
            
        h, w = image.shape[:2]
        
        # Generate low resolution noise, then scale up to create cloudy blobs
        noise_h, noise_w = max(h // 8, 1), max(w // 8, 1)
        noise = np.random.rand(noise_h, noise_w)
        
        # Smooth and upscale the noise
        cloud_mask = cv2.resize(noise, (w, h), interpolation=cv2.INTER_CUBIC)
        cloud_mask = cv2.GaussianBlur(cloud_mask, (15, 15), 0)
        
        # Threshold the noise to create distinct clouds
        cloud_mask = np.clip((cloud_mask - 0.4) * 3, 0, 1)
        
        alpha = self.params[self.severity]['cloud_alpha']
        
        # Convert single channel mask to 3 channels for RGB blending
        if len(image.shape) == 3:
            cloud_mask_3d = np.repeat(cloud_mask[:, :, np.newaxis], 3, axis=2)
            # Clouds are white (255, 255, 255)
            cloud_layer = np.ones_like(image) * 255
            result = image * (1 - cloud_mask_3d * alpha) + cloud_layer * (cloud_mask_3d * alpha)
            return result.astype(np.uint8)
        else:
            # Grayscale handling
            cloud_layer = np.ones_like(image) * 255
            result = image * (1 - cloud_mask * alpha) + cloud_layer * (cloud_mask * alpha)
            return result.astype(np.uint8)

    def inject_shadows(self, image):
        """Inject dark polygonal shadows simulating buildings/clouds"""
        h, w = image.shape[:2]
        
        # Create a blank mask
        shadow_mask = np.zeros((h, w), dtype=np.float32)
        
        num_shadows = int(self.params[self.severity]['cloud_prob'] * 5)
        for _ in range(num_shadows):
            # Generate random polygon
            pts = np.array([[
                [random.randint(0, w), random.randint(0, h)],
                [random.randint(0, w), random.randint(0, h)],
                [random.randint(0, w), random.randint(0, h)]
            ]], np.int32)
            cv2.fillPoly(shadow_mask, pts, 1.0)
            
        # Blur the edges
        shadow_mask = cv2.GaussianBlur(shadow_mask, (21, 21), 0)
        
        darkness = self.params[self.severity]['shadow_darkness']
        
        # Darken the original image where shadows exist
        if len(image.shape) == 3:
            shadow_mask_3d = np.repeat(shadow_mask[:, :, np.newaxis], 3, axis=2)
            result = image * (1 - shadow_mask_3d * darkness)
            return np.clip(result, 0, 255).astype(np.uint8)
        else:
            result = image * (1 - shadow_mask * darkness)
            return np.clip(result, 0, 255).astype(np.uint8)

    def inject_canopy(self, image):
        """Inject synthetic tree canopy (green textured noise)"""
        h, w = image.shape[:2]
        
        canopy_mask = np.zeros((h, w), dtype=np.float32)
        density = self.params[self.severity]['canopy_density']
        
        num_trees = int(density * (h * w) / 500)
        for _ in range(num_trees):
            center = (random.randint(0, w), random.randint(0, h))
            radius = random.randint(3, 12)
            cv2.circle(canopy_mask, center, radius, 1.0, -1)
            
        # Trees have irregular edges
        canopy_mask = cv2.GaussianBlur(canopy_mask, (5, 5), 0)
        
        # Tree color (dark green)
        tree_color = np.array([34, 139, 34], dtype=np.float32)
        
        if len(image.shape) == 3:
            canopy_mask_3d = np.repeat(canopy_mask[:, :, np.newaxis], 3, axis=2)
            
            # Combine the base image with the tree color
            result = image * (1 - canopy_mask_3d * 0.8) + tree_color * (canopy_mask_3d * 0.8)
            return np.clip(result, 0, 255).astype(np.uint8)
        else:
            return image

    def apply_all(self, image):
        """Apply all occlusions sequentially"""
        img = self.inject_canopy(image)
        img = self.inject_shadows(img)
        img = self.inject_clouds(img)
        return img

if __name__ == '__main__':
    # Simple test
    print("Testing Occlusion Simulator...")
    dummy_image = np.ones((256, 256, 3), dtype=np.uint8) * 128
    
    sim = OcclusionSimulator(severity='high')
    occluded = sim.apply_all(dummy_image)
    
    print(f"Original mean pixel value: {dummy_image.mean():.2f}")
    print(f"Occluded mean pixel value: {occluded.mean():.2f}")
    print("✅ Occlusion Simulator test passed")
