---
reference: 34
title: Chart Type Demonstrations
description: Complete guide to all supported chart types in PaperCMS, showcasing both single and multi-dataset configurations across bar, line, pie, doughnut, radar, polar area, and bubble charts.
date:
    published: 2025-08-14
    updated: 2025-08-14
thumbnail: /content/media/chart.png
status: published
contributors:
    - role: author
      name: Gabriel Baude
      avatar: /content/media/avatars/gabriel_baude.jpg
category: making-of
subcategories:
    - charts
    - visualization
    - development
tags:
    - charts
    - visualization
    - data
    - documentation
    - demo
---

# Chart Type Demonstrations

This document demonstrates all supported chart types in PaperCMS, showcasing both single and multi-dataset configurations.

## Bar Charts

# Model Evolution Chart Datasets for PaperCMS

## Chart 1: Overall Model Performance Evolution

### Multi-Dataset Line Chart
Shows overall accuracy improvement and dataset growth over time.

```chart
{
  "type": "line",
  "title": "Overall Model Performance Evolution - 2020",
  "data": {
    "labels": ["July 28", "July 30", "August 6", "October 30"],
    "datasets": [
      {
        "label": "Overall Accuracy (%)",
        "data": [88.11, 90.63, 90.94, 95.89]
      },
      {
        "label": "Dataset Size (thousands)",
        "data": [14.709, 14.709, 14.709, 64.183]
      }
    ]
  }
}
```

## Chart 2A: Category Performance by Model Version

### Multi-Dataset Line Chart
Shows accuracy evolution across different UI component categories.

```chart
{
  "type": "line",
  "title": "UI Component Category Performance Evolution",
  "data": {
    "labels": ["July 28", "July 30", "August 6", "October 30"],
    "datasets": [
      {
        "label": "Layout",
        "data": [22.00, 46.88, 64.13, 96.81]
      },
      {
        "label": "Typography",
        "data": [78.22, 77.44, 77.52, 98.27]
      },
      {
        "label": "Control",
        "data": [94.93, 96.66, 96.75, 98.39]
      },
      {
        "label": "Navigation",
        "data": [75.82, 90.46, 90.80, 95.68]
      },
      {
        "label": "Content",
        "data": [91.11, 90.75, 90.14, 91.49]
      }
    ]
  }
}
```

## Chart 2B: Training Instances by Category

### Multi-Dataset Line Chart
Shows training dataset growth across different UI component categories.

```chart
{
  "type": "line",
  "title": "Training Dataset Growth by Component Category",
  "data": {
    "labels": ["July 28", "July 30", "August 6", "October 30"],
    "datasets": [
      {
        "label": "Control",
        "data": [7121, 7121, 7121, 29693]
      },
      {
        "label": "Content", 
        "data": [4838, 4838, 4838, 21667]
      },
      {
        "label": "Typography",
        "data": [1619, 1619, 1619, 8206]
      },
      {
        "label": "Navigation",
        "data": [819, 819, 819, 3330]
      },
      {
        "label": "Layout",
        "data": [312, 312, 312, 1287]
      }
    ]
  }
}
```

## Bonus Chart 3: Biggest Component Improvements

### Single Dataset Bar Chart
Shows which individual components had the most dramatic improvements.

```chart
{
  "type": "bar",
  "title": "Biggest Component Accuracy Improvements",
  "data": {
    "labels": ["section-break", "currency-euro", "radio", "link", "checkbox"],
    "datasets": [{
      "label": "Improvement (%)",
      "data": [96.59, 97.27, 29.49, 24.20, 18.99]
    }]
  }
}
```

## Bonus Chart 4: Final Model Performance by Category

### Single Dataset Doughnut Chart
Shows the final accuracy distribution across component categories.

```chart
{
  "type": "doughnut",
  "title": "Final Model Accuracy by Component Category (October 30)",
  "data": {
    "labels": ["Control", "Typography", "Layout", "Navigation", "Content"],
    "datasets": [{
      "label": "Final Accuracy (%)",
      "data": [98.39, 98.27, 96.81, 95.68, 91.49]
    }]
  }
}
```

## Bonus Chart 6: Dataset Growth Comparison (Bar Chart)

### Multi-Dataset Bar Chart
Compare dataset sizes between initial and final models by category.

```chart
{
  "type": "bar",
  "title": "Dataset Size Growth: Initial vs Final Model",
  "data": {
    "labels": ["Control", "Content", "Typography", "Navigation", "Layout"],
    "datasets": [
      {
        "label": "Initial (July 28)",
        "data": [7121, 4838, 1619, 819, 312]
      },
      {
        "label": "Final (October 30)",
        "data": [29693, 21667, 8206, 3330, 1287]
      }
    ]
  }
}
```

## Bonus Chart 7: Dataset Growth Multipliers

### Single Dataset Bar Chart
Shows how many times each category's dataset grew from initial to final model.

```chart
{
  "type": "bar",
  "title": "Dataset Growth Multipliers by Category",
  "data": {
    "labels": ["Typography", "Content", "Control", "Navigation", "Layout"],
    "datasets": [{
      "label": "Growth Multiplier (x times)",
      "data": [5.07, 4.48, 4.17, 4.07, 4.13]
    }]
  }
}
```


## Single Dataset Bar Chart
```chart
{
  "type": "scatter",
  "title": "Component Performance: Training Instances vs Accuracy (October 30, 2020)",
  "data": {
    "datasets": [
      {
        "label": "Layout",
        "data": [
          {"x": 1287, "y": 96.81, "label": "section-break"}
        ]
      },
      {
        "label": "Typography", 
        "data": [
          {"x": 1588, "y": 96.39, "label": "heading"},
          {"x": 1606, "y": 98.55, "label": "paragraph"},
          {"x": 1666, "y": 99.37, "label": "unordered-list"},
          {"x": 1657, "y": 99.77, "label": "ordered-list"},
          {"x": 1689, "y": 97.27, "label": "currency-euro"}
        ]
      },
      {
        "label": "Control",
        "data": [
          {"x": 1768, "y": 99.71, "label": "button-flat"},
          {"x": 1628, "y": 98.08, "label": "button-outlined"},
          {"x": 1699, "y": 99.18, "label": "button-text"},
          {"x": 1602, "y": 97.02, "label": "checkbox"},
          {"x": 1699, "y": 99.14, "label": "input-date"},
          {"x": 1602, "y": 98.88, "label": "input-email"},
          {"x": 1647, "y": 99.20, "label": "input-number"},
          {"x": 1643, "y": 99.48, "label": "input-password"},
          {"x": 1639, "y": 97.82, "label": "input-phone"},
          {"x": 1619, "y": 98.63, "label": "input-search"},
          {"x": 1653, "y": 99.73, "label": "input-stepper"},
          {"x": 1619, "y": 96.88, "label": "input-text"},
          {"x": 1691, "y": 93.96, "label": "radio"},
          {"x": 1607, "y": 98.63, "label": "select"},
          {"x": 1702, "y": 97.20, "label": "slider"},
          {"x": 1596, "y": 99.43, "label": "toggle"},
          {"x": 1616, "y": 98.68, "label": "textarea"},
          {"x": 1663, "y": 99.41, "label": "rating"}
        ]
      },
      {
        "label": "Navigation",
        "data": [
          {"x": 1675, "y": 98.43, "label": "breadcrumb"},
          {"x": 1655, "y": 92.93, "label": "link"}
        ]
      },
      {
        "label": "Content",
        "data": [
          {"x": 1638, "y": 97.88, "label": "accordion"},
          {"x": 1715, "y": 99.73, "label": "avatar"},
          {"x": 1669, "y": 98.87, "label": "chip-choice"},
          {"x": 1666, "y": 99.76, "label": "chip-filter"},
          {"x": 1649, "y": 99.75, "label": "chip-input"},
          {"x": 1704, "y": 97.99, "label": "divider-horizontal"},
          {"x": 1684, "y": 99.38, "label": "icon"},
          {"x": 1645, "y": 99.72, "label": "icon-social"},
          {"x": 1594, "y": 97.91, "label": "image"},
          {"x": 1630, "y": 99.55, "label": "logo"},
          {"x": 1674, "y": 99.60, "label": "table-data"},
          {"x": 1628, "y": 99.17, "label": "video"},
          {"x": 1771, "y": 98.67, "label": "map"}
        ]
      }
    ]
  }
}
```

## Chart Data Summary

### Key Metrics Tracked
- **Overall Accuracy**: Model performance across all components
- **Dataset Size**: Number of training instances available
- **Category Performance**: Accuracy by UI component type
- **Category Instances**: Training data volume by component category
- **Individual Improvements**: Component-specific progress

### Model Development Timeline
- **July 28, 2020**: Initial model baseline (88.11% accuracy, 14,709 instances)
- **July 30, 2020**: Quick iteration improvement (+2.52% accuracy, same dataset)
- **August 6, 2020**: Minor refinement (+0.31% accuracy, same dataset)
- **October 30, 2020**: Major breakthrough with expanded dataset (+4.95% accuracy, 64,183 instances)

### Dataset Growth Analysis
The October 30 model shows dramatic dataset expansion across all categories:

- **Control**: 7,121 → 29,693 instances (4.17x growth)
- **Content**: 4,838 → 21,667 instances (4.48x growth)  
- **Typography**: 1,619 → 8,206 instances (5.07x growth)
- **Navigation**: 819 → 3,330 instances (4.07x growth)
- **Layout**: 312 → 1,287 instances (4.13x growth)

### Component Categories
1. **Layout** (2 components): Section breaks, cards
2. **Typography** (5 components): Headings, paragraphs, lists, currency
3. **Control** (18 components): Buttons, inputs, forms, toggles
4. **Navigation** (5 components): Breadcrumbs, links, menus, tabs
5. **Content** (15 components): Icons, images, avatars, chips, accordions

### Notable Insights
- **Dramatic improvement**: Layout components went from 22% to 96.81% accuracy
- **Consistent performers**: Control components maintained high accuracy throughout
- **Dataset impact**: 4.4x increase in training data led to significant performance gains
- **Uniform growth**: All categories roughly quadrupled in dataset size
- **Typography boost**: Had the highest growth multiplier (5.07x) and showed major accuracy improvement
- **Problem components**: Even components starting near 0% reached excellent performance

These charts demonstrate the successful evolution of a UI component detection model through iterative development and strategic data expansion.

## Chart Configuration Notes

### Data Structure Guidelines

**Single Dataset Charts:**
- Use different colors for each data point
- Ideal for categorical data comparison
- Supports: bar, line, pie, doughnut, radar, polarArea, bubble

**Multi-Dataset Charts:**
- Use consistent colors per dataset
- Perfect for comparing multiple series
- Supports: bar, line, radar, polarArea, bubble
- Note: pie/doughnut charts typically use single dataset

### Color Behavior

- **Single Dataset**: Each bar/point gets a different color from the palette
- **Multi-Dataset**: Each dataset gets one color, used consistently across all points in that dataset
- **Theme Support**: All charts automatically adapt to light/dark themes
- **Accessibility**: Color palette designed for good contrast and readability

### Responsive Design

All charts are:
- Fully responsive and mobile-friendly
- Properly sized within their containers
- Optimized for both desktop and mobile viewing
- Support theme switching without page reload

### Chart Types Summary

| Chart Type | Single Dataset | Multi-Dataset | Use Case |
|------------|----------------|---------------|----------|
| **Bar** | ✅ Different colors per bar | ✅ Different colors per dataset | Categorical comparisons |
| **Line** | ✅ Filled area | ✅ Multiple lines | Trends over time |
| **Pie** | ✅ Different colors per slice | ❌ Not typical | Part-to-whole relationships |
| **Doughnut** | ✅ Different colors per slice | ❌ Not typical | Part-to-whole with emphasis |
| **Radar** | ✅ Single shape | ✅ Multiple overlaid shapes | Multi-dimensional analysis |
| **Polar Area** | ✅ Different colors per sector | ✅ Overlaid areas | Radial data with magnitude |
| **Bubble** | ✅ Single series | ✅ Multiple series | Three-dimensional relationships |

This comprehensive demo showcases the flexibility and power of the PaperCMS chart system across all supported chart types.