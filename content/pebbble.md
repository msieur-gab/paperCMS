---
reference: 33
title: Pebbble - Crafting Presence Through Code
description: Pebbble is a design-driven project born from a deeply human need — to preserve the irreplaceable bond of a parent's voice across physical and digital divides. It blends ancient ritual, modern cryptography, and crafted hardware into a secure, tactile experience. Drawing from Japanese joinery philosophy, it redefines technology as a vessel of presence, resilience, and love.
date:
    published: 2025-08-12
    updated: 2025-08-12
thumbnail: /content/media/pebbles.jpg
status: published
contributors:
    - role: author
      name: Gabriel Baude
      avatar: /content/media/avatars/gabriel_baude.jpg
category: project
subcategories:
    - design
    - user-experience
    - hardware
    - cryptography
tags:
    - product design
    - user experience
    - cryptography
    - hardware
    - mobile development
    - kanawa-tsugi
related:
    - content/kanawa-tsugite.md
documents:
    - Pebbble Technical Whitepaper: https://www.example.com
    - Refactor Progress Tracker: https://www.example.com
links:
    - Project website: https://loomr.org
    - GitHub repository: https://github.com/example/pebbble
project:
    status: completed
    timeline:
        start: 2024-01
        end: 2024-11
    client: Personal Project (LOOMR.org)
---

# Pebbble: When Design Becomes a Mandate

![Pebbble hardware concept](media/pebbles.jpg "cover")

## The Mandate: A Designer's Response to Anguish

My work on the Pebbble project is not a mere technical exercise; it is a personal mandate born from a deeply human problem [cite: Pebbble, 33]. As a designer, I see my role as a custodian of human wisdom, reviving forgotten techniques to solve contemporary problems [cite: Pebbble, 13].  

Pebbble addresses the *liminal agony of vanishment* felt by parents separated from their children — a pain without ritual or closure [cite: Pebbble, 9]. The challenge was to preserve the bond of a parent's voice when digital tools are hostile, compromised, or inadequate to carry the weight of interrupted love [cite: Pebbble, 11]. This project is my tangible response to that need.

```chart-bar
{
  "title": "Reported International Parental Child Abduction Cases (2020-2023)",
  "data": {
    "labels": ["2020", "2021", "2022", "2023"],
    "datasets": [
      {
        "label": "USA",
        "data": [700, 700, 982, 982]
      },
      {
        "label": "France",
        "data": [540, 544, 544, 661]
      },
      {
        "label": "Germany",
        "data": [604, 650, 599, 527]
      },
      {
        "label": "United Kingdom",
        "data": [239, 243, 258, 243]
      },
      {
        "label": "Canada",
        "data": [122, 199, 199, 199]
      }
    ]
  }
}
```

## The Craft: From Ancient Wisdom to Tangible Presence

To bridge this emotional and physical distance, I drew inspiration from ancient craftsmanship, believing that technology should feel less like surveillance and more like love made tangible [cite: Pebbble, 31].  

I looked to the centuries-old Japanese joinery technique *Kanawa-tsugite*, achieving structural elegance and integrity without nails [cite: kanawa.md]. This principle — that complexity can arise from simple, elegant rules — became Pebbble’s guiding design philosophy.

it represente almost 1 million reported missing childrens only for the selected countries in 2023

```chart-bar
{
  "title": "Annually Reported Missing Children (2020-2023)",
  "data": {
    "labels": ["2020", "2021", "2022", "2023"],
    "datasets": [
      {
        "label": "USA",
        "data": [421000, 421000, 359094, 344813]
      },
      {
        "label": "France",
        "data": [43456, 45958, 43202, 40989]
      },
      {
        "label": "Germany",
        "data": [100000, 100000, 100000, 100000]
      },
      {
        "label": "United Kingdom",
        "data": [239343, 250069, 278105, 312901]
      },
      {
        "label": "Canada",
        "data": [35463, 39268, 39268, 34437]
      }
    ]
  }
}```

The triple 'b' in "Pebbble" represents the bounce of a stone across water, creating ripples that reach distant shores [cite: Pebbble, 30]. Like Hop-o’-My-Thumb scattering white pebbles to find his way home, Pebbble stones guide children back to the sound of a parent's voice, serving as tactile, secure anchors across impossible distances [cite: Pebbble, 20, 37].  

Holding, scanning, and listening to a Pebbble mirrors ancient prayer practices, grounding digital interaction in meaningful ritual [cite: Pebbble, 28].

> "The next morning, very early, Tom Thumb got up and went to the edge of a river, where he filled his pockets with little white pebbles... 
> 'Don't be afraid,' said Tom Thumb, 'we are where we wanted to be; follow me, and I will take you back home, 
> because I have scattered white pebbles all along the path.'"
> — *The Tale of Hop-o'-My-Thumb*  




## The Solution: Security Rooted in Ritual

This design philosophy shaped the technical architecture. The stone itself became the key to the messages [cite: Pebbble, 20], creating a model both intuitive and defensible [cite: Pebbble, 139].

### Physical Key Derivation

Each Pebbble contains an embedded NFC chip, acting as a physical token [cite: Pebbble, 16]. More secure than software keys, it uses the stone’s unique serial number with a timestamp to derive an unreproducible encryption key [cite: Pebbble, 24].
```chart-bar
{
  "title": "Single Dataset Test",
            "data": {
                "labels": ["Apple", "Banana", "Orange", "Grape", "Kiwi"],
                "datasets": [{
                    "label": "Fruits",
                    "data": [12, 19, 8, 15, 7]
                }]
            }
}
```
### Zero-Knowledge Privacy

Messages are encrypted client-side using AES-256 [cite: Pebbble, 23, 82]. No secrets are stored in URLs or the cloud — only possession of the correct stone enables decryption [cite: Pebbble, 18, 87].

### Decentralized Resilience

Encrypted data is stored via IPFS for censorship-resistant, immutable communications [cite: Pebbble, 25, 26]. Smart gateway fallbacks ensure reliable access [cite: Pebbble, 70-78].

---

## Code and Craft, Together

Refactoring the code into modular services (`finalizationService.js`, `audioService.js`) and fixing critical bugs (e.g., audio memory leaks, cross-device issues) was essential to product stability [cite: refactor_progress_tracker.md].  

Pebbble proves that design can address deeply emotional challenges, reinforcing my belief that our greatest strength is to connect across impossible distances [cite: Pebbble, 34, 151].

![Pebbble prototype and joinery inspiration](media/pebbles.jpg)
