# News CSS Test Cases - Automation Summary

## Overall Totals
| Metric | Count |
| :--- | :--- |
| **Total Test Cases** | 36 |
| **Passed** | 10 |
| **Failed** | 26 |
| **Locator Issues (Not Found)** | 0 |

---

## Test Results Overview
| TC ID | Test Case | Status | Differing Properties Count |
| :--- | :--- | :---: | :---: |
| **TC01** | Content is centered with side gutters | ❌ Fail | 4 |
| **TC02** | Consistent spacing from top and bottom | ❌ Fail | 4 |
| **TC03** | Heading size, weight and color | ❌ Fail | 1 |
| **TC04** | Heading and More button on one row, opposite ends | ✅ Pass | 0 |
| **TC05** | More button border and corner radius | ❌ Fail | 8 |
| **TC06** | More button inner spacing and text style | ❌ Fail | 6 |
| **TC07** | Two cards side by side with equal width | ❌ Fail | 1 |
| **TC08** | Both cards have the same height | ❌ Fail | 2 |
| **TC09** | Gap between the two cards | ❌ Fail | 2 |
| **TC10** | Image fills card without stretching | ❌ Fail | 3 |
| **TC11** | Title overlaid at bottom-left of image | ✅ Pass | 0 |
| **TC12** | Title text readable on image | ✅ Pass | 0 |
| **TC13** | Title font size, weight and line height | ❌ Fail | 3 |
| **TC14** | Title shown above the image | ✅ Pass | 0 |
| **TC15** | Long titles do not overflow the card | ❌ Fail | 1 |
| **TC16** | Four cards in one row with equal width | ❌ Fail | 1 |
| **TC17** | Gap between small cards | ❌ Fail | 2 |
| **TC18** | All small images have the same height | ❌ Fail | 3 |
| **TC19** | Title below image with proper spacing | ✅ Pass | 0 |
| **TC20** | Title font size, weight, color and line height | ❌ Fail | 4 |
| **TC21** | Long titles clamped or wrapped without overlap | ❌ Fail | 1 |
| **TC22** | Vertical gap between big row and small row | ❌ Fail | 2 |
| **TC23** | Label is small and grey | ❌ Fail | 2 |
| **TC24** | Label position relative to title | ❌ Fail | 2 |
| **TC25** | Fixed at bottom-right of viewport | ❌ Fail | 3 |
| **TC26** | Size and shape | ❌ Fail | 6 |
| **TC27** | Background and icon color | ❌ Fail | 2 |
| **TC28** | Stays above other content | ❌ Fail | 1 |
| **TC29** | Card hover effect (zoom or shadow) | ✅ Pass | 0 |
| **TC30** | Title hover color or underline | ✅ Pass | 0 |
| **TC31** | More button hover | ❌ Fail | 2 |
| **TC32** | Pointer cursor on clickable items | ✅ Pass | 0 |
| **TC33** | Tablet (~768px): small cards 2 per row | ❌ Fail | 2 |
| **TC34** | Mobile (~375px): cards stack in 1 column | ❌ Fail | 1 |
| **TC35** | No horizontal scroll at any width | ✅ Pass | 1 |
| **TC36** | Font sizes scale down on smaller screens | ✅ Pass | 0 |

---

## Detailed Failure Reports

### TC01 - Content is centered with side gutters
**Section**: Section container | **Element Under Test**: `News section container`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `margin-top` | `7.5px` | `0px` | `-7.50px` |
| `margin-bottom` | `7.5px` | `0px` | `-7.50px` |
| `padding-left` | `7.5px` | `120px` | `+112.50px` |
| `padding-right` | `7.5px` | `120px` | `+112.50px` |

### TC02 - Consistent spacing from top and bottom
**Section**: Section container | **Element Under Test**: `News section container`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `margin-top` | `7.5px` | `0px` | `-7.50px` |
| `margin-bottom` | `7.5px` | `0px` | `-7.50px` |
| `padding-top` | `15px` | `0px` | `-15.00px` |
| `padding-bottom` | `15px` | `0px` | `-15.00px` |

### TC03 - Heading size, weight and color
**Section**: Header | **Element Under Test**: `Section heading (News)`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `color` | `rgb(0, 50, 122)` | `rgb(0, 36, 143)` | `changed` |

### TC05 - More button border and corner radius
**Section**: Header | **Element Under Test**: `More button`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `border-top-width` | `1px` | `2px` | `+1.00px` |
| `border-right-width` | `1px` | `2px` | `+1.00px` |
| `border-bottom-width` | `1px` | `2px` | `+1.00px` |
| `border-left-width` | `1px` | `2px` | `+1.00px` |
| `border-top-left-radius` | `5px` | `8px` | `+3.00px` |
| `border-top-right-radius` | `5px` | `8px` | `+3.00px` |
| `border-bottom-right-radius` | `5px` | `8px` | `+3.00px` |
| `border-bottom-left-radius` | `5px` | `8px` | `+3.00px` |

### TC06 - More button inner spacing and text style
**Section**: Header | **Element Under Test**: `More button`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `padding-top` | `7.5px` | `4px` | `-3.50px` |
| `padding-right` | `7.5px` | `8px` | `+0.50px` |
| `padding-bottom` | `7.5px` | `4px` | `-3.50px` |
| `padding-left` | `7.5px` | `8px` | `+0.50px` |
| `font-weight` | `600` | `700` | `changed` |
| `color` | `rgb(225, 10, 21)` | `rgb(221, 8, 22)` | `changed` |

### TC07 - Two cards side by side with equal width
**Section**: Big cards | **Element Under Test**: `Big card (first and second)`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `width` | `547.5px` | `592px` | `+44.50px` |

### TC08 - Both cards have the same height
**Section**: Big cards | **Element Under Test**: `Big card (first and second)`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `height` | `307.969px` | `253.703px` | `-54.27px` |
| `aspect-ratio` | `auto` | `` | `changed` |

### TC09 - Gap between the two cards
**Section**: Big cards | **Element Under Test**: `Big cards container`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `gap` | `normal` | `16px` | `changed` |
| `column-gap` | `normal` | `16px` | `changed` |

### TC10 - Image fills card without stretching
**Section**: Big cards | **Element Under Test**: `Big card image`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `object-fit` | `fill` | `contain` | `changed` |
| `width` | `547.5px` | `592px` | `+44.50px` |
| `height` | `307.969px` | `253.703px` | `-54.27px` |

### TC13 - Title font size, weight and line height
**Section**: Big cards | **Element Under Test**: `Big card title`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `font-size` | `20px` | `16px` | `-4.00px` |
| `font-weight` | `600` | `700` | `changed` |
| `line-height` | `normal` | `26px` | `changed` |

### TC15 - Long titles do not overflow the card
**Section**: Big cards | **Element Under Test**: `Big card title`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `-webkit-line-clamp` | `3` | `2` | `changed` |

### TC16 - Four cards in one row with equal width
**Section**: Small cards | **Element Under Test**: `Small card (all four)`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `width` | `266.25px` | `288px` | `+21.75px` |

### TC17 - Gap between small cards
**Section**: Small cards | **Element Under Test**: `Small cards container`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `gap` | `normal` | `16px` | `changed` |
| `column-gap` | `normal` | `16px` | `changed` |

### TC18 - All small images have the same height
**Section**: Small cards | **Element Under Test**: `Small card image`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `height` | `149.766px` | `123.422px` | `-26.34px` |
| `aspect-ratio` | `auto 400 / 225` | `auto` | `changed` |
| `object-fit` | `fill` | `contain` | `changed` |

### TC20 - Title font size, weight, color and line height
**Section**: Small cards | **Element Under Test**: `Small card title`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `font-size` | `14px` | `18px` | `+4.00px` |
| `font-weight` | `600` | `700` | `changed` |
| `color` | `rgb(0, 2, 13)` | `rgb(26, 26, 26)` | `changed` |
| `line-height` | `normal` | `24px` | `changed` |

### TC21 - Long titles clamped or wrapped without overlap
**Section**: Small cards | **Element Under Test**: `Small card title`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `-webkit-line-clamp` | `3` | `` | `changed` |

### TC22 - Vertical gap between big row and small row
**Section**: Small cards | **Element Under Test**: `Cards container`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `row-gap` | `normal` | `16px` | `changed` |
| `margin-top` | `7.5px` | `0px` | `-7.50px` |

### TC23 - Label is small and grey
**Section**: Category label | **Element Under Test**: `Category label (News)`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `font-size` | `11px` | `12px` | `+1.00px` |
| `color` | `rgba(255, 255, 255, 0.5)` | `rgb(175, 184, 197)` | `changed` |

### TC24 - Label position relative to title
**Section**: Category label | **Element Under Test**: `Category label (News)`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `display` | `inline` | `flex` | `changed` |
| `position` | `static` | `relative` | `changed` |

### TC25 - Fixed at bottom-right of viewport
**Section**: Scroll-to-top | **Element Under Test**: `Scroll-to-top button`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `position` | `relative` | `fixed` | `changed` |
| `right` | `0px` | `24px` | `+24.00px` |
| `bottom` | `0px` | `24px` | `+24.00px` |

### TC26 - Size and shape
**Section**: Scroll-to-top | **Element Under Test**: `Scroll-to-top button`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `width` | `40px` | `44px` | `+4.00px` |
| `height` | `40px` | `44px` | `+4.00px` |
| `border-top-left-radius` | `3px` | `9999px` | `+9996.00px` |
| `border-top-right-radius` | `3px` | `9999px` | `+9996.00px` |
| `border-bottom-right-radius` | `3px` | `9999px` | `+9996.00px` |
| `border-bottom-left-radius` | `3px` | `9999px` | `+9996.00px` |

### TC27 - Background and icon color
**Section**: Scroll-to-top | **Element Under Test**: `Scroll-to-top button`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `background-color` | `rgb(245, 165, 0)` | `rgb(17, 17, 17)` | `changed` |
| `color` | `rgb(0, 0, 0)` | `rgb(255, 255, 255)` | `changed` |

### TC28 - Stays above other content
**Section**: Scroll-to-top | **Element Under Test**: `Scroll-to-top button`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `z-index` | `auto` | `40` | `changed` |

### TC31 - More button hover
**Section**: Interaction | **Element Under Test**: `More button`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `background-color` | `rgba(0, 0, 0, 0)` | `rgb(242, 242, 242)` | `changed` |
| `color` | `rgb(225, 10, 21)` | `rgb(221, 8, 22)` | `changed` |

### TC33 - Tablet (~768px): small cards 2 per row
**Section**: Responsive | **Element Under Test**: `Small cards container`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `grid-template-columns` | `none` | `0px 0px 0px 0px 0px 0px 0px 0px 0px 191.328px 191.328px 191.328px` | `changed` |
| `width` | `705px` | `750px` | `+45.00px` |

### TC34 - Mobile (~375px): cards stack in 1 column
**Section**: Responsive | **Element Under Test**: `Cards containers`

| Property | Site 1 | Site 2 | Diff |
| :--- | :--- | :--- | :--- |
| `grid-template-columns` | `none` | `0px 0px 0px 0px 0px 0px 29.5px 29.5px 29.5px 26.1562px 26.1562px 26.1562px` | `changed` |
