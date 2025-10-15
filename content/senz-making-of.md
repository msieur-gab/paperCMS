---
reference: 35
title: Building an ML Generator from Zero
description: "The complete journey of building Senz, an AI/ML sketch-to-MVP generator. From initial paper sketches to production-ready models, this chronicles our path through dataset creation, labeling pipelines, training services, and the countless challenges we overcame to transform simple pen-and-paper drawings into working AI systems."
date:
    published: 2025-08-14
    updated: 2025-08-14
thumbnail: /content/media/senz-sketches.jpg
status: draft
contributors:
    - role: author
      name: Gabriel Baude
      avatar: /content/media/avatars/gabriel_baude.jpg
category: making-of
subcategories:
    - artificial-intelligence
    - machine-learning
    - product-development
    - data-engineering
tags:
    - AI-development
    - sketch-to-code
    - dataset-creation
    - machine-learning-pipeline
    - MVP-development
    - computer-vision
    - training-services
related:
    - content/custom-ai-article.md
documents:
    - "Senz Technical Architecture": "Technical specifications and system design"
    - "Dataset Labeling Guidelines": "Comprehensive guide for annotation workflows"
links:
    - "Senz Demo": "https://example.com/senz-demo"
    - "GitHub Repository": "https://github.com/example/senz"
---

# Senz: From Sketches to AI

  ![Video description](media/senz.webm "autoplay mute 2x nocontrols")
*The making of an AI/ML generator that transforms simple sketches into working MVPs*

## The Beginning: Just a Pen and Paper

Every revolutionary AI system starts with the most analog tool possible—a pen and a piece of paper. Senz began as a simple question: *What if we could bridge the gap between human creativity and machine execution?* What if a designer could sketch an interface on paper and have an AI system understand, interpret, and generate a working prototype?

The vision was ambitious, perhaps naively so. We wanted to create a system that could:
- Recognize hand-drawn UI elements from sketches
- Understand layout relationships and hierarchies  
- Generate clean, functional code from rough drawings
- Learn from user feedback to improve over time

But vision without execution is just dreaming. This is the story of how we built Senz from the ground up.

## Phase 1: Understanding the Problem Space

Before writing a single line of code, we needed to understand what we were really building. The challenge wasn't just computer vision—it was bridging the semantic gap between human intention and machine interpretation.

### The Core Challenges

**Sketch Ambiguity**: Human sketches are inherently imprecise. A rectangle could be a button, a text field, or a container. Context is everything.

**Style Variations**: Every person draws differently. Some use precise lines, others rough strokes. Some annotate heavily, others rely purely on visual cues.

**Intent Recognition**: Beyond recognizing shapes, we needed to understand user intent. Is this a navigation menu or a list of items? Is this a form or a dashboard?

**Layout Understanding**: Recognizing individual elements was just the beginning. Understanding their relationships—hierarchy, alignment, grouping—was the real challenge.

## Phase 2: Building the Foundation

### Data Strategy: Creating Our Training Universe

The first major decision was data. No existing dataset could serve our needs. We needed sketches paired with their intended digital outputs—thousands of them.

**The Collection Process**:
1. **Designer Partnerships**: We partnered with design agencies and freelancers, asking them to share their sketching process
2. **Crowdsourced Sketching**: Created tasks where people sketched common UI patterns
3. **Synthetic Generation**: Built tools to automatically generate sketch-like variations of existing designs
4. **Academic Collaboration**: Worked with design schools to collect student wireframes and sketches

By month three, we had accumulated over 50,000 sketch-interface pairs across different domains: mobile apps, web interfaces, dashboard layouts, and form designs.

### The Labeling Pipeline: Teaching Machines to See Like Designers

Raw sketches were just the beginning. Each image needed rich annotations:

**Semantic Labeling**:
- Element type (button, input, text, image, etc.)
- Element properties (size, style, hierarchy level)
- Relationships (parent-child, alignment, grouping)
- Intent markers (navigation, content, interaction)

**The Annotation Platform**:

We built a custom labeling platform that allowed annotators to:
- Draw bounding boxes around elements
- Assign semantic labels from our taxonomy
- Define relationships between elements
- Capture layout hierarchies visually

The platform included quality control features:
- Multi-annotator consensus requirements
- Expert review workflows
- Automated consistency checks
- Inter-annotator agreement metrics

**Quality Challenges**:

Maintaining annotation quality at scale proved more difficult than anticipated. We discovered that different annotators interpreted the same sketch differently, especially for ambiguous elements. 

Our solution: **Contextual Guidelines**. Instead of rigid rules, we created contextual decision trees that helped annotators understand the reasoning behind each label choice.

## Phase 3: Model Architecture and Training

### The Neural Architecture

We settled on a multi-stage pipeline rather than an end-to-end approach:

**Stage 1: Element Detection**
- Modified YOLO architecture for sketch-based object detection
- Custom loss functions to handle sketch ambiguity
- Data augmentation specific to hand-drawn variations

**Stage 2: Relationship Mapping**
- Graph neural networks to understand element relationships
- Attention mechanisms for layout hierarchy understanding
- Spatial reasoning modules for alignment and grouping

**Stage 3: Code Generation**
- Transformer-based architecture for code synthesis
- Template-based generation with learned parameters
- Multi-target output (React, HTML/CSS, Flutter)

### Training Challenges and Solutions

**Challenge 1: Sketch Variability**
Sketches varied dramatically in style, clarity, and convention. Our initial models performed well on clean, architectural-style sketches but failed on rough, creative drawings.

*Solution*: Aggressive data augmentation and style transfer techniques. We generated thousands of variations for each base sketch, simulating different drawing styles, line weights, and annotation approaches.

**Challenge 2: Layout Understanding**
Early models could identify individual elements but struggled with spatial relationships and layout hierarchies.

*Solution*: We incorporated explicit spatial reasoning modules and trained on layout graphs rather than just bounding boxes. This helped the model understand not just *what* elements were present, but *how* they related to each other.

**Challenge 3: Semantic Ambiguity**
The same visual element could serve different functions depending on context. A rectangle could be a button, input field, or content container.

*Solution*: Multi-task learning with uncertainty estimation. The model learned to output probability distributions over possible interpretations rather than hard classifications, allowing downstream components to make contextually informed decisions.

## Phase 4: The MVP Development Cycle

### Iterative Refinement

Building Senz wasn't a linear process. Each version revealed new challenges and opportunities:

**Version 0.1**: Basic element detection
- Could identify common UI elements with 70% accuracy
- Struggled with complex layouts and overlapping elements
- Generated static HTML without interactivity

**Version 0.2**: Relationship understanding
- Added spatial reasoning capabilities
- Improved layout hierarchy detection
- Introduced basic component classification

**Version 0.3**: Interactive generation
- Generated functional React components
- Added event handling and basic state management
- Introduced style consistency algorithms

**Version 0.4**: Learning from feedback
- Implemented active learning pipeline
- Added user correction mechanisms
- Introduced confidence-based quality metrics

### Model Confidence Evolution

The journey wasn't smooth. Our model confidence fluctuated significantly as we experimented with different approaches, data quality issues, and architectural changes. After nearly a year of iterations, a breakthrough in our neural architecture finally brought us to consistent 89% accuracy.

```chart
{
  "type": "line",
  "title": "Senz Model Confidence & Team Mood Over Time",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    "datasets": [
      {
        "label": "Model Accuracy (%)",
        "data": [45, 52, 48, 61, 58, 65, 59, 62, 71, 73, 68, 89]
      },
      {
        "label": "Team Mood (1-10)",
        "data": [95, 75, 35, 70, 45, 75, 50, 65, 80, 85, 60, 95]
      }
    ]
  }
}
```

The chart reveals two intertwined stories: our model's technical evolution and our team's emotional journey. We started with sky-high enthusiasm (95% mood) in January, but by March, when our model accuracy dropped to 48%, our spirits plummeted to 35% - a classic case of overreacting to technical setbacks.

What's fascinating is how we learned to calibrate our expectations. By mid-year, we'd developed resilience, maintaining steady optimism (75-85% mood) even during model plateaus. Our mood became less reactive to individual drops, though we still couldn't help the slight dip in November when accuracy dropped to 68%.

The December breakthrough brought both lines to euphoric peaks - 89% accuracy met with 95% team mood. We'd learned that building AI systems is as much about emotional endurance as technical prowess.

### Real-World Testing

The true test came when we started working with actual designers and developers. We learned that accuracy metrics in isolation meant little—the system needed to be *useful* and *learnable*.

**Key Insights from User Testing**:

1. **Partial Success Was Often Better Than Perfect Failure**: Users preferred when the system got 80% of their sketch right rather than failing completely on complex drawings.

2. **Corrections Should Be Easy**: When the system made mistakes, users needed simple ways to correct them without starting over.

3. **Confidence Indication Mattered**: Users wanted to know when the system was uncertain, allowing them to focus corrections where they were most needed.

4. **Incremental Generation Was Preferred**: Rather than generating complete interfaces at once, users preferred building up complexity gradually.

## Phase 5: Production Challenges

### Scaling the Infrastructure

Moving from prototype to production introduced entirely new challenges:

**Training Infrastructure**:
- Distributed training across multiple GPUs
- Experiment tracking and model versioning
- Automated hyperparameter optimization
- Continuous integration for model updates

**Inference Optimization**:
- Model quantization for faster inference
- Edge deployment for real-time sketching
- Batch processing for bulk conversions
- Caching strategies for common patterns

**Data Pipeline Management**:
- Real-time annotation quality monitoring
- Automated data validation and cleaning
- Version control for datasets
- Privacy-preserving data handling

### The Feedback Loop

Production deployment revealed the importance of continuous learning. Users generated new sketch patterns we hadn't anticipated, exposed edge cases in our models, and provided invaluable correction data.

We implemented a feedback system where:
- User corrections automatically updated our training data
- Model confidence scores guided active learning
- A/B testing validated model improvements
- Expert review ensured data quality

## Lessons Learned

### Technical Insights

**1. Data Quality Trumps Quantity**: We initially focused on collecting massive amounts of data. We learned that 10,000 high-quality, diverse examples were more valuable than 100,000 mediocre ones.

**2. Human-in-the-Loop is Essential**: Pure automation wasn't enough. The most successful approaches incorporated human feedback and correction mechanisms throughout the pipeline.

**3. Context is Everything**: Individual element recognition was relatively straightforward. Understanding context, relationships, and user intent proved far more challenging and valuable.

**4. Incremental Complexity Works**: Rather than trying to solve everything at once, incremental approaches that built complexity gradually were more successful and debuggable.

### Product Insights

**1. User Mental Models Matter**: How users think about the sketching process significantly impacted system design. Understanding their mental models was as important as technical capabilities.

**2. Confidence and Transparency Build Trust**: Users needed to understand what the system could and couldn't do. Transparent confidence indication was crucial for adoption.

**3. Correction Workflows Are Core Features**: The ability to easily correct and refine system outputs wasn't a nice-to-have—it was essential for practical deployment.

## The Future of Senz

Building Senz taught us that the future of AI-assisted design isn't about replacing human creativity—it's about amplifying it. The most powerful moments came when designers could iterate rapidly between sketching and digital prototyping, using AI as a bridge between ideation and implementation.

As we continue developing Senz, we're focusing on:
- Multi-modal input (voice annotations, gesture recognition)
- Collaborative sketching and shared AI assistance
- Domain-specific specialization (mobile, web, IoT interfaces)
- Integration with existing design tools and workflows

The journey from sketches to AI taught us that the most important technology decisions aren't always technical—they're about understanding human creativity and building systems that enhance rather than replace human capabilities.

---

*Building Senz from zero required more than technical expertise—it demanded deep empathy for the creative process and relentless focus on human-centered design. Every dataset annotation, every model architecture decision, and every user interface choice was guided by one principle: amplify human creativity, don't replace it.*