---
# Informations essentielles
title: "Mon Projet Awesome"
category: "project" # article/project/research
status: "published" # draft/published/archived
date: "2024-03-23"
lastModified: "2024-03-23"

# Métadonnées de classification
tags: ["design", "frontend", "javascript", "markdown"]
keywords: ["portfolio", "web development", "UX design"]
technologies: ["JavaScript", "CSS3", "HTML5", "Markdown"]
topics: ["Web Development", "User Interface", "Documentation"]

# SEO et partage social
description: "Une description courte et percutante de votre projet en ~150 caractères"
socialImage: "media/workshop.jpg"
socialImageAlt: "Capture d'écran principale du projet"

# Informations projet (si category: project)
projectStart: "2024-01-15"
projectEnd: "2024-03-15"
client: "Nom du client"
role: "Lead Developer"
team: ["John Doe", "Jane Smith"]
website: "https://example.com"
repository: "https://github.com/username/project"

# Informations recherche (si category: research)
institution: "Nom de l'université/laboratoire"
supervisor: "Dr. John Smith"
collaborators: ["Institution A", "Laboratory B"]
funding: "Nom du programme de financement"
doi: "10.1234/example.doi"

# Informations article (si category: article)
author: "Votre Nom"
coAuthors: ["Autre Auteur"]
readingTime: "10 minutes"
language: "fr" # fr/en/es etc.

# Métadonnées personnalisées
featured: true # Pour mettre en avant sur la page d'accueil
order: 1 # Pour contrôler l'ordre d'affichage
relatedContent: ["projet-1", "article-2"] # Liens vers du contenu connexe
difficulty: "intermediate" # beginner/intermediate/advanced
license: "MIT"
---


---
# Mandatory fields
title: Joinery in design
type: project     # Possible values: project, concept, prototype, article, post
slug: joinery-in-design   # URL-friendly version of the title
date: 
    created: 2024-11-25
    updated: 2024-11-25
    published: 2024-11-25

# Content metadata
description: An exploration of Kanawa-tsugi, a traditional Japanese woodworking technique
excerpt: A shorter version of the description for listings (optional, falls back to description)
author: 
    name: John Doe
    email: john@example.com   # Optional
    avatar: /media/authors/john.jpg   # Optional

# Categorization
category: woodworking    # Primary category
subcategories:          # More specific categorization
    - design
    - japanese-craft

tags:                   # Additional metadata for filtering
    - kanawa-tsugi
    - joinery
    - craftsmanship
    - wood

# Status flags
status: 
    published: true     # If false, won't appear in public listings
    featured: true      # Can be highlighted in UI
    archived: false     # For old content that should be preserved but not prominently displayed

# Visual assets
media:
    thumbnail: media/workshop.jpg    # Main image for listings
    banner: media/workshop-wide.jpg  # Optional header image
    gallery:                        # Additional images that might be used in listings or previews
        - media/detail1.jpg
        - media/detail2.jpg

# Relations and sequence
sequence:
    order: 1           # For manual ordering within same type/category
    series: japanese-techniques  # For content that's part of a series
    related:           # Manually curated related content
        - type: project
          slug: project4
        - type: article
          slug: traditional-woodworking
    
# Technical metadata
template: project-display    # Optional - specify which template to use for rendering
language: en                # Content language
translations:              # Available translations
    fr: /fr/projets/joinery-in-design
    es: /es/proyectos/joinery-in-design

# Custom metadata (project-specific)
project:
    status: completed      # in-progress, completed, on-hold
    timeline:
        start: 2024-01
        end: 2024-11
    client: Personal Project
    technologies:          # Specific to technical projects
        - woodworking
        - traditional-techniques
---

# Mon Projet Awesome

![Interface principale de l'application](media/workshop.jpg)
...