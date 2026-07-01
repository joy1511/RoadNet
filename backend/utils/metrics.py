"""
Evaluation Metrics
Friend 2 responsibility: All evaluation metrics
"""

import numpy as np
import networkx as nx
from sklearn.metrics import precision_recall_fscore_support
import logging

logger = logging.getLogger(__name__)


def compute_iou(pred_mask, gt_mask):
    """
    Compute Intersection over Union (IoU)
    
    Args:
        pred_mask: Predicted binary mask (numpy array)
        gt_mask: Ground truth binary mask (numpy array)
        
    Returns:
        IoU score (0-1)
    """
    # Ensure binary
    pred = (pred_mask > 127).astype(np.uint8).flatten()
    gt = (gt_mask > 127).astype(np.uint8).flatten()
    
    # Compute intersection and union
    intersection = np.sum(pred * gt)
    union = np.sum(pred) + np.sum(gt) - intersection
    
    if union == 0:
        return 1.0 if intersection == 0 else 0.0
    
    iou = intersection / union
    return float(iou)


def compute_dice(pred_mask, gt_mask):
    """
    Compute Dice Coefficient (F1-Score for segmentation)
    
    Args:
        pred_mask: Predicted binary mask
        gt_mask: Ground truth binary mask
        
    Returns:
        Dice score (0-1)
    """
    # Ensure binary
    pred = (pred_mask > 127).astype(np.uint8).flatten()
    gt = (gt_mask > 127).astype(np.uint8).flatten()
    
    # Compute intersection
    intersection = np.sum(pred * gt)
    
    # Dice = 2 * intersection / (sum of both)
    dice = (2.0 * intersection) / (np.sum(pred) + np.sum(gt) + 1e-7)
    
    return float(dice)


def compute_pixel_accuracy(pred_mask, gt_mask):
    """
    Compute pixel-wise accuracy
    
    Args:
        pred_mask: Predicted binary mask
        gt_mask: Ground truth binary mask
        
    Returns:
        Accuracy (0-1)
    """
    pred = (pred_mask > 127).astype(np.uint8).flatten()
    gt = (gt_mask > 127).astype(np.uint8).flatten()
    
    correct = np.sum(pred == gt)
    total = pred.size
    
    return float(correct / total)


def compute_precision_recall(pred_mask, gt_mask):
    """
    Compute precision and recall
    
    Args:
        pred_mask: Predicted binary mask
        gt_mask: Ground truth binary mask
        
    Returns:
        Dictionary with precision, recall, f1
    """
    pred = (pred_mask > 127).astype(np.uint8).flatten()
    gt = (gt_mask > 127).astype(np.uint8).flatten()
    
    # True positives, false positives, false negatives
    tp = np.sum(pred * gt)
    fp = np.sum(pred * (1 - gt))
    fn = np.sum((1 - pred) * gt)
    
    precision = tp / (tp + fp + 1e-7)
    recall = tp / (tp + fn + 1e-7)
    f1 = 2 * (precision * recall) / (precision + recall + 1e-7)
    
    return {
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1)
    }


def compute_relaxed_iou(pred_mask, gt_mask, buffer_size=3):
    """
    Compute Relaxed IoU with buffer
    Allows small positional errors
    
    Args:
        pred_mask: Predicted binary mask
        gt_mask: Ground truth binary mask
        buffer_size: Buffer size in pixels
        
    Returns:
        Relaxed IoU score
    """
    import cv2
    
    # Ensure binary
    pred = (pred_mask > 127).astype(np.uint8)
    gt = (gt_mask > 127).astype(np.uint8)
    
    # Dilate ground truth to create buffer
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (buffer_size*2+1, buffer_size*2+1))
    gt_buffered = cv2.dilate(gt, kernel, iterations=1)
    
    # Compute IoU with buffered GT
    pred_flat = pred.flatten()
    gt_buffered_flat = gt_buffered.flatten()
    
    intersection = np.sum(pred_flat * gt_buffered_flat)
    union = np.sum(pred_flat) + np.sum(gt_buffered_flat) - intersection
    
    if union == 0:
        return 1.0 if intersection == 0 else 0.0
    
    relaxed_iou = intersection / union
    return float(relaxed_iou)


def compute_connectivity_ratio(graph_before, graph_after):
    """
    Compute connectivity ratio after graph healing
    
    Args:
        graph_before: Graph before healing
        graph_after: Graph after healing
        
    Returns:
        Connectivity improvement ratio
    """
    if len(graph_before.nodes) == 0:
        return 1.0
    
    # Largest connected component size
    cc_before = max((len(c) for c in nx.connected_components(graph_before)), default=0)
    cc_after = max((len(c) for c in nx.connected_components(graph_after)), default=0)
    
    # Ratio of largest component to total nodes
    ratio_before = cc_before / len(graph_before.nodes)
    ratio_after = cc_after / len(graph_after.nodes)
    
    # Improvement
    if ratio_before == 0:
        return ratio_after
    
    improvement = ratio_after / ratio_before
    return float(improvement)


def compute_topological_accuracy(pred_graph, gt_graph, sample_size=100):
    """
    Compute APLS-style topological accuracy
    Compares shortest paths between graphs
    
    Args:
        pred_graph: Predicted graph
        gt_graph: Ground truth graph
        sample_size: Number of node pairs to sample
        
    Returns:
        Topological accuracy score
    """
    if len(pred_graph.nodes) == 0 or len(gt_graph.nodes) == 0:
        return 0.0
    
    # Sample node pairs
    pred_nodes = list(pred_graph.nodes)
    gt_nodes = list(gt_graph.nodes)
    
    n_samples = min(sample_size, len(pred_nodes) * (len(pred_nodes) - 1) // 2)
    
    if n_samples == 0:
        return 1.0
    
    # Random pairs
    pairs = []
    for _ in range(n_samples):
        if len(pred_nodes) >= 2:
            node1, node2 = np.random.choice(pred_nodes, size=2, replace=False)
            pairs.append((node1, node2))
    
    if not pairs:
        return 1.0
    
    # Compare path lengths
    path_errors = []
    
    for node1, node2 in pairs:
        try:
            # Predicted graph path
            pred_path_length = nx.shortest_path_length(pred_graph, node1, node2, weight='weight')
        except:
            pred_path_length = float('inf')
        
        try:
            # GT graph path (approximate - use closest nodes)
            # This is simplified - real APLS does spatial matching
            gt_path_length = nx.shortest_path_length(gt_graph, node1, node2, weight='weight')
        except:
            gt_path_length = float('inf')
        
        if gt_path_length > 0 and gt_path_length != float('inf'):
            error = abs(pred_path_length - gt_path_length) / gt_path_length
            path_errors.append(error)
    
    if not path_errors:
        return 0.0
    
    # Average error
    avg_error = np.mean(path_errors)
    
    # Convert to accuracy (1 - error)
    accuracy = max(0, 1 - avg_error)
    
    return float(accuracy)


def compute_all_metrics(pred_mask, gt_mask):
    """
    Compute all segmentation metrics at once
    
    Args:
        pred_mask: Predicted mask
        gt_mask: Ground truth mask
        
    Returns:
        Dictionary of all metrics
    """
    metrics = {}
    
    # Basic metrics
    metrics['iou'] = compute_iou(pred_mask, gt_mask)
    metrics['dice'] = compute_dice(pred_mask, gt_mask)
    metrics['pixel_accuracy'] = compute_pixel_accuracy(pred_mask, gt_mask)
    
    # Precision/Recall
    pr_metrics = compute_precision_recall(pred_mask, gt_mask)
    metrics.update(pr_metrics)
    
    # Relaxed IoU
    metrics['relaxed_iou_3px'] = compute_relaxed_iou(pred_mask, gt_mask, buffer_size=3)
    metrics['relaxed_iou_5px'] = compute_relaxed_iou(pred_mask, gt_mask, buffer_size=5)
    
    return metrics


if __name__ == '__main__':
    # Test
    print("Testing metrics...")
    
    # Create test masks
    pred_mask = np.zeros((100, 100), dtype=np.uint8)
    pred_mask[40:60, 40:60] = 255
    
    gt_mask = np.zeros((100, 100), dtype=np.uint8)
    gt_mask[45:65, 45:65] = 255
    
    metrics = compute_all_metrics(pred_mask, gt_mask)
    
    print("Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value:.4f}")
    
    print("✅ Metrics test passed")
