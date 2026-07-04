"""
Plot Metrics
Friend 2 responsibility: Produce final metrics table/plots for presentation
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import os

# Set style for professional presentation plots
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_context("talk")

class MetricsVisualizer:
    def __init__(self, output_dir='results/plots'):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
    def plot_model_comparison(self, data_df):
        """
        Plot IoU and Dice comparison between baseline and context-aware models
        Args:
            data_df: DataFrame with columns ['Model', 'IoU', 'Dice', 'Relaxed_IoU_3px']
        """
        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        
        metrics = ['IoU', 'Dice', 'Relaxed_IoU_3px']
        titles = ['Standard IoU', 'Dice Coefficient (F1)', 'Relaxed IoU (3px Buffer)']
        
        for idx, (metric, title) in enumerate(zip(metrics, titles)):
            sns.barplot(data=data_df, x='Model', y=metric, ax=axes[idx], palette='viridis')
            axes[idx].set_title(title, pad=15)
            axes[idx].set_ylim(0, 1.0)
            
            # Add value labels
            for p in axes[idx].patches:
                axes[idx].annotate(f"{p.get_height():.3f}", 
                                   (p.get_x() + p.get_width() / 2., p.get_height()),
                                   ha='center', va='center', xytext=(0, 10), 
                                   textcoords='offset points', fontweight='bold')
                
        plt.suptitle("Model Performance Comparison on Test Set", fontsize=20, y=1.05)
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'model_comparison.png'), dpi=300, bbox_inches='tight')
        plt.close()
        print(f"Saved model_comparison.png")

    def plot_occlusion_robustness(self, occlusion_df):
        """
        Plot how performance degrades with varying levels of occlusion
        Args:
            occlusion_df: DataFrame ['Severity', 'Baseline_Recall', 'ContextAware_Recall']
        """
        plt.figure(figsize=(10, 6))
        
        plt.plot(occlusion_df['Severity'], occlusion_df['Baseline_Recall'], 
                 marker='o', linewidth=3, markersize=10, label='Baseline DeepLabV3+')
        plt.plot(occlusion_df['Severity'], occlusion_df['ContextAware_Recall'], 
                 marker='s', linewidth=3, markersize=10, label='Context-Aware Transformer')
                 
        plt.title('Robustness Under Synthetic Occlusion (Clouds/Canopy)', pad=20)
        plt.xlabel('Occlusion Severity')
        plt.ylabel('Occlusion-Recall')
        plt.ylim(0, 1.0)
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.7)
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'occlusion_robustness.png'), dpi=300)
        plt.close()
        print(f"Saved occlusion_robustness.png")

    def plot_healing_impact(self, healing_df):
        """
        Plot Connectivity Ratio and Topological Accuracy before/after healing
        Args:
            healing_df: DataFrame ['Metric', 'Before Healing', 'After Healing']
        """
        melted_df = pd.melt(healing_df, id_vars=['Metric'], value_vars=['Before Healing', 'After Healing'],
                            var_name='Stage', value_name='Score')
                            
        plt.figure(figsize=(12, 7))
        sns.barplot(data=melted_df, x='Metric', y='Score', hue='Stage', palette=['#ff9999', '#66b3ff'])
        
        plt.title('Impact of Topological Graph Healing (MST + Disjoint Set)', pad=20)
        plt.ylim(0, 1.0)
        
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'healing_impact.png'), dpi=300)
        plt.close()
        print(f"Saved healing_impact.png")

    def generate_final_metrics_table(self, df, filename='final_metrics.csv'):
        """Export a clean CSV table for the presentation"""
        filepath = os.path.join(self.output_dir, filename)
        df.to_csv(filepath, index=False)
        print(f"Saved final metrics table to {filepath}")

if __name__ == '__main__':
    print("Generating sample metric plots for presentation...")
    vis = MetricsVisualizer()
    
    # 1. Model Comparison Data
    model_df = pd.DataFrame({
        'Model': ['Baseline (DeepLabV3+)', 'Proposed (Context-Aware)'],
        'IoU': [0.652, 0.741],
        'Dice': [0.789, 0.851],
        'Relaxed_IoU_3px': [0.821, 0.894]
    })
    vis.plot_model_comparison(model_df)
    
    # 2. Occlusion Robustness Data
    occ_df = pd.DataFrame({
        'Severity': ['None', 'Low', 'Medium', 'High'],
        'Baseline_Recall': [0.85, 0.72, 0.51, 0.35],
        'ContextAware_Recall': [0.86, 0.81, 0.74, 0.62]
    })
    vis.plot_occlusion_robustness(occ_df)
    
    # 3. Healing Impact Data
    heal_df = pd.DataFrame({
        'Metric': ['Connectivity Ratio', 'Topological Accuracy (APLS)'],
        'Before Healing': [0.45, 0.62],
        'After Healing': [0.92, 0.88]
    })
    vis.plot_healing_impact(heal_df)
    
    # 4. Generate CSV Table
    final_table = pd.DataFrame({
        'Metric': ['IoU', 'Dice', 'Relaxed IoU', 'Occlusion-Recall (Med)', 'Connectivity Ratio', 'APLS'],
        'Baseline': [0.652, 0.789, 0.821, 0.510, 0.450, 0.620],
        'Proposed Pipeline': [0.741, 0.851, 0.894, 0.740, 0.920, 0.880],
        'Absolute Improvement': ['+8.9%', '+6.2%', '+7.3%', '+23.0%', '+47.0%', '+26.0%']
    })
    vis.generate_final_metrics_table(final_table)
    
    print("✅ All plots generated successfully in results/plots/")
