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

## Detailed Component Analysis Table

### Complete Component Breakdown by Category

| **Category** | **Component** | **July 28, 2020** | | **July 30, 2020** | | **August 6, 2020** | | **October 30, 2020** | |
|--------------|---------------|-------------------|---|-------------------|---|-------------------|---|---------------------|---|
| | | *Instances* | *Accuracy* | *Instances* | *Accuracy* | *Instances* | *Accuracy* | *Instances* | *Accuracy* |
| **Layout (2 components)** | | | | | | | | | |
| | section-break | 312 | 0.22% | 312 | 46.88% | 312 | 64.13% | 1,287 | 96.81% |
| | card | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | **Category Total** | **312** | **22.00%** | **312** | **46.88%** | **312** | **64.13%** | **1,287** | **96.81%** |
| **Typography (5 components)** | | | | | | | | | |
| | heading | 417 | 93.99% | 417 | 92.63% | 417 | 92.38% | 1,588 | 96.39% |
| | paragraph | 441 | 98.50% | 441 | 97.21% | 441 | 97.33% | 1,606 | 98.55% |
| | unordered-list | 364 | 98.95% | 364 | 98.08% | 364 | 98.64% | 1,666 | 99.37% |
| | ordered-list | 397 | 99.66% | 397 | 99.27% | 397 | 99.23% | 1,657 | 99.77% |
| | currency-euro | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 1,689 | 97.27% |
| | **Category Total** | **1,619** | **78.22%** | **1,619** | **77.44%** | **1,619** | **77.52%** | **8,206** | **98.27%** |
| **Control (18 components)** | | | | | | | | | |
| | button-flat | 401 | 98.77% | 401 | 99.65% | 401 | 99.76% | 1,768 | 99.71% |
| | button-outlined | 416 | 96.64% | 416 | 96.41% | 416 | 96.73% | 1,628 | 98.08% |
| | button-text | 357 | 98.15% | 357 | 97.71% | 357 | 98.14% | 1,699 | 99.18% |
| | checkbox | 385 | 78.03% | 385 | 92.57% | 385 | 93.40% | 1,602 | 97.02% |
| | input-date | 375 | 98.61% | 375 | 97.16% | 375 | 96.76% | 1,699 | 99.14% |
| | input-email | 393 | 98.50% | 393 | 98.19% | 393 | 97.88% | 1,602 | 98.88% |
| | input-number | 390 | 98.75% | 390 | 98.21% | 390 | 97.51% | 1,647 | 99.20% |
| | input-password | 393 | 99.41% | 393 | 99.17% | 393 | 98.89% | 1,643 | 99.48% |
| | input-phone | 369 | 97.21% | 369 | 95.85% | 369 | 95.91% | 1,639 | 97.82% |
| | input-search | 400 | 97.97% | 400 | 96.74% | 400 | 97.13% | 1,619 | 98.63% |
| | input-stepper | 397 | 99.75% | 397 | 99.52% | 397 | 99.58% | 1,653 | 99.73% |
| | input-text | 395 | 96.38% | 395 | 93.84% | 395 | 95.52% | 1,619 | 96.88% |
| | radio | 390 | 64.47% | 390 | 88.93% | 390 | 88.99% | 1,691 | 93.96% |
| | select | 393 | 98.10% | 393 | 98.04% | 393 | 97.63% | 1,607 | 98.63% |
| | slider | 392 | 92.10% | 392 | 94.04% | 392 | 93.80% | 1,702 | 97.20% |
| | toggle | 446 | 98.88% | 446 | 98.88% | 446 | 98.69% | 1,596 | 99.43% |
| | textarea | 423 | 98.28% | 423 | 96.98% | 423 | 96.65% | 1,616 | 98.68% |
| | rating | 406 | 98.77% | 406 | 98.06% | 406 | 98.46% | 1,663 | 99.41% |
| | **Category Total** | **7,121** | **94.93%** | **7,121** | **96.66%** | **7,121** | **96.75%** | **29,693** | **98.39%** |
| **Navigation (5 components)** | | | | | | | | | |
| | breadcrumb | 404 | 82.90% | 404 | 95.31% | 404 | 96.41% | 1,675 | 98.43% |
| | drawer | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | link | 415 | 68.73% | 415 | 85.60% | 415 | 85.18% | 1,655 | 92.93% |
| | menu | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | tabs | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | **Category Total** | **819** | **75.82%** | **819** | **90.46%** | **819** | **90.80%** | **3,330** | **95.68%** |
| **Content (15 components)** | | | | | | | | | |
| | accordion | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 1,638 | 97.88% |
| | accordion-open | 398 | 96.18% | 398 | 94.68% | 398 | 86.37% | 0 | 0.00% |
| | avatar | 414 | 99.27% | 414 | 99.21% | 414 | 99.08% | 1,715 | 99.73% |
| | chip-choice | 396 | 98.99% | 396 | 98.96% | 396 | 98.88% | 1,669 | 98.87% |
| | chip-filter | 388 | 99.08% | 388 | 98.87% | 388 | 99.15% | 1,666 | 99.76% |
| | chip-input | 394 | 99.28% | 394 | 98.84% | 394 | 98.97% | 1,649 | 99.75% |
| | divider-horizontal | 400 | 95.18% | 400 | 95.00% | 400 | 95.01% | 1,704 | 97.99% |
| | divider-vertical | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | icon | 385 | 98.76% | 385 | 99.45% | 385 | 99.42% | 1,684 | 99.38% |
| | icon-social | 422 | 99.58% | 422 | 99.18% | 422 | 99.36% | 1,645 | 99.72% |
| | image | 380 | 99.97% | 380 | 99.14% | 380 | 99.01% | 1,594 | 97.91% |
| | logo | 424 | 98.69% | 424 | 98.79% | 424 | 98.92% | 1,630 | 99.55% |
| | table-data | 407 | 99.97% | 407 | 99.64% | 407 | 99.38% | 1,674 | 99.60% |
| | video | 430 | 99.47% | 430 | 98.05% | 430 | 98.23% | 1,628 | 99.17% |
| | map | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 1,771 | 98.67% |
| | **Category Total** | **4,838** | **91.11%** | **4,838** | **90.75%** | **4,838** | **90.14%** | **21,667** | **91.49%** |
| **Feedback (3 components)** | | | | | | | | | |
| | dialog | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | progress | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | snackbar | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% | 0 | 0.00% |
| | **Category Total** | **0** | **0.00%** | **0** | **0.00%** | **0** | **0.00%** | **0** | **0.00%** |
| **GRAND TOTAL** | **48 components listed** | **14,709** | **88.11%** | **14,709** | **90.63%** | **14,709** | **90.94%** | **64,183** | **95.89%** |

### Key Insights from Individual Component Analysis

**Biggest Individual Improvements:**
- **section-break**: 0.22% → 96.81% (+96.59%) - most dramatic improvement
- **currency-euro**: New component added in October (0 → 1,689 instances, 97.27%)
- **checkbox**: 78.03% → 97.02% (+18.99%)
- **radio**: 64.47% → 93.96% (+29.49%) 
- **link**: 68.73% → 92.93% (+24.20%)

**Consistently High Performers:**
- **input-stepper**: 99.75% → 99.73% (maintained excellence)
- **table-data**: 99.97% → 99.60% (slight decrease but still excellent)
- **icon-social**: 99.58% → 99.72% (maintained excellence)
- **chip-filter**: 99.08% → 99.76% (improved further)

**New Components Added in October:**
- **currency-euro**: 1,689 instances, 97.27% accuracy
- **accordion**: 1,638 instances, 97.88% accuracy  
- **map**: 1,771 instances, 98.67% accuracy

**Components Removed/Changed:**
- **accordion-open**: Present in early models (398 instances), replaced by generic "accordion" in October

**Average Instances per Component by Category (October 30):**
- **Layout**: 644 instances/component (1,287 ÷ 2)
- **Typography**: 1,641 instances/component (8,206 ÷ 5) 
- **Control**: 1,650 instances/component (29,693 ÷ 18)
- **Navigation**: 1,665 instances/component (3,330 ÷ 2 active)
- **Content**: 1,667 instances/component (21,667 ÷ 13 active)

This shows the dataset was quite evenly distributed per component in the final model, with each component getting roughly 1,600-1,700 training instances.

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