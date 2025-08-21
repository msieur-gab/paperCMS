---
reference: 34
title: Chart Type Demonstrations
description: Complete guide to all supported chart types in PaperCMS, showcasing both single and multi-dataset configurations across bar, line, pie, doughnut, radar, polar area, and bubble charts.
date:
    published: 2025-08-14
    updated: 2025-08-14
thumbnail: /content/media/chart.png
status: draft
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

### Single Dataset Bar Chart
Different colors for each bar category.

```chart
{
  "type": "bar",
  "title": "Fruit Sales - Single Dataset",
  "data": {
    "labels": ["Apples", "Oranges", "Bananas", "Grapes", "Strawberries"],
    "datasets": [{
      "label": "Units Sold",
      "data": [45, 32, 28, 15, 22]
    }]
  }
}
```

### Multi-Dataset Bar Chart
Different colors for each dataset, same color per dataset across all bars.

```chart
{
  "type": "bar", 
  "title": "Quarterly Sales Comparison",
  "data": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [
      {
        "label": "2023",
        "data": [120, 150, 180, 200]
      },
      {
        "label": "2024", 
        "data": [140, 170, 190, 220]
      },
      {
        "label": "Projected 2025",
        "data": [160, 185, 210, 240]
      }
    ]
  }
}
```

## Line Charts

### Single Dataset Line Chart
Filled area under the line with gradient effect.

```chart
{
  "type": "line",
  "title": "Website Traffic Over Time",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [{
      "label": "Visitors",
      "data": [1200, 1900, 3000, 5000, 4200, 6000]
    }]
  }
}
```

### Multi-Dataset Line Chart
Multiple lines without fill, each with distinct colors.

```chart
{
  "type": "line",
  "title": "Performance Metrics Comparison", 
  "data": {
    "labels": ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    "datasets": [
      {
        "label": "Load Time (ms)",
        "data": [850, 720, 650, 580, 520]
      },
      {
        "label": "Memory Usage (MB)",
        "data": [245, 230, 220, 210, 195]
      },
      {
        "label": "CPU Usage (%)",
        "data": [65, 58, 52, 48, 45]
      }
    ]
  }
}
```

## Pie Charts

### Single Dataset Pie Chart
Classic pie chart with different colors for each slice.

```chart
{
  "type": "pie",
  "title": "Market Share Distribution",
  "data": {
    "labels": ["Chrome", "Safari", "Firefox", "Edge", "Others"],
    "datasets": [{
      "label": "Browser Usage",
      "data": [65.2, 19.1, 9.2, 4.1, 2.4]
    }]
  }
}
```

## Doughnut Charts

### Single Dataset Doughnut Chart
Similar to pie but with center hollow.

```chart
{
  "type": "doughnut",
  "title": "Project Time Allocation",
  "data": {
    "labels": ["Development", "Testing", "Design", "Documentation", "Meetings"],
    "datasets": [{
      "label": "Hours Spent",
      "data": [40, 15, 20, 10, 15]
    }]
  }
}
```

## Radar Charts

### Single Dataset Radar Chart
Shows data across multiple axes in a circular format.

```chart
{
  "type": "radar",
  "title": "Skill Assessment - Individual",
  "data": {
    "labels": ["JavaScript", "CSS", "HTML", "React", "Node.js", "Design"],
    "datasets": [{
      "label": "Current Level",
      "data": [8, 7, 9, 6, 5, 4]
    }]
  }
}
```

### Multi-Dataset Radar Chart
Compare multiple entities across the same dimensions.

```chart
{
  "type": "radar",
  "title": "Team Skills Comparison",
  "data": {
    "labels": ["JavaScript", "CSS", "HTML", "React", "Node.js", "Design"],
    "datasets": [
      {
        "label": "Alice",
        "data": [9, 6, 8, 8, 7, 3]
      },
      {
        "label": "Bob", 
        "data": [7, 8, 9, 5, 6, 7]
      },
      {
        "label": "Charlie",
        "data": [6, 7, 7, 9, 8, 5]
      }
    ]
  }
}
```

## Polar Area Charts

### Single Dataset Polar Area Chart
Like pie chart but with varying radius based on value.

```chart
{
  "type": "polarArea",
  "title": "Resource Utilization",
  "data": {
    "labels": ["CPU", "Memory", "Storage", "Network", "GPU"],
    "datasets": [{
      "label": "Usage Percentage",
      "data": [75, 60, 45, 30, 85]
    }]
  }
}
```

### Multi-Dataset Polar Area Chart
Multiple overlapping polar areas for comparison.

```chart
{
  "type": "polarArea",
  "title": "Server Performance - Multi Environment",
  "data": {
    "labels": ["CPU", "Memory", "Storage", "Network"],
    "datasets": [
      {
        "label": "Production",
        "data": [80, 70, 60, 50]
      },
      {
        "label": "Staging",
        "data": [60, 50, 45, 40]
      }
    ]
  }
}
```

## Bubble Charts

### Single Dataset Bubble Chart
Each bubble represents a data point with x, y, and size dimensions.

```chart
{
  "type": "bubble",
  "title": "Product Performance Analysis",
  "data": {
    "datasets": [{
      "label": "Products",
      "data": [
        {"x": 20, "y": 30, "r": 15, "label": "Product A"},
        {"x": 40, "y": 10, "r": 10, "label": "Product B"}, 
        {"x": 60, "y": 50, "r": 20, "label": "Product C"},
        {"x": 80, "y": 25, "r": 8, "label": "Product D"},
        {"x": 30, "y": 70, "r": 18, "label": "Product E"}
      ]
    }]
  }
}
```

### Multi-Dataset Bubble Chart
Compare different categories or time periods.

```chart
{
  "type": "bubble",
  "title": "Market Position Analysis - Multiple Quarters",
  "data": {
    "datasets": [
      {
        "label": "Q1 2024",
        "data": [
          {"x": 30, "y": 40, "r": 12},
          {"x": 50, "y": 30, "r": 15},
          {"x": 70, "y": 60, "r": 10}
        ]
      },
      {
        "label": "Q2 2024",
        "data": [
          {"x": 35, "y": 45, "r": 14},
          {"x": 55, "y": 35, "r": 18},
          {"x": 75, "y": 65, "r": 12}
        ]
      }
    ]
  }
}
```

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