# 👁️ Visual Reference Guide - About & Programs Pages

## What Your Pages Should Look Like

---

## 📄 About Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                  About Resti Kiryandongo CBO                  │
│                                                               │
│  Founded with a mission to empower and uplift communities... │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────┐
│ 🌿 Our Mission                │ 💙 Our Vision                 │
│ [Emerald Background]          │ [Blue Background]             │
│                               │                               │
│ To empower communities in     │ A thriving, self-sustaining  │
│ Kiryandongo through...        │ community where every...      │
│                               │                               │
└──────────────────────────────┴──────────────────────────────┘

                    Our Core Values

┌──────────┬──────────┬──────────┬──────────┐
│ 💚       │ 👥       │ 🎯       │ 🏆       │
│          │          │          │          │
│Compassion│Community │  Impact  │Excellence│
│          │          │          │          │
│We approach│Working  │Focused on│Committed │
│every...  │together..│measurable│to high...│
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Our Story                              │
│ [Gray Background]                                             │
│                                                               │
│ Resti Kiryandongo CBO was born from a shared vision...       │
│                                                               │
│ Today, we work closely with local government...              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Programs Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                        Our Programs                           │
│                                                               │
│  We run comprehensive programs designed to address the...    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬────────────────┐
│ [Program Image]│ [Program Image]│ [Program Image]│
│                │                │                │
│ Education      │ Healthcare     │ Economic       │
│                │                │                │
│ Quality Edu... │ Community      │ Skills Train...│
│ Providing      │ Providing      │ Empowering     │
│ access to...   │ healthcare...  │ community...   │
│                │                │                │
└────────────────┴────────────────┴────────────────┘

┌────────────────┬────────────────┬────────────────┐
│ [Program Image]│ [Program Image]│ [Program Image]│
│                │                │                │
│ [More programs if added via admin dashboard]    │
│                │                │                │
└────────────────┴────────────────┴────────────────┘
```

---

## 🎨 Color Palette

### About Page Colors:

**Mission Card**:
- Background: `linear-gradient(from-emerald-50 to-teal-50)` 
- Border on hover: `emerald-200`
- Title hover: `emerald-600`

**Vision Card**:
- Background: `linear-gradient(from-blue-50 to-indigo-50)`
- Border on hover: `blue-200`
- Title hover: `blue-600`

**Values Cards**:
- Background: `white`
- Border: `gray-200` → `emerald-200` on hover
- Icon container: `emerald-100` → `emerald-600` on hover
- Icon: `emerald-600` → `white` on hover
- Title hover: `emerald-600`

**Story Section**:
- Background: `gray-50`
- Text: `gray-700`
- Rounded: `2xl`

### Programs Page Colors:

**Program Cards**:
- Background: `white`
- Shadow: `sm` → `xl` on hover
- Border: Rounded `xl`

**Category Badge**:
- Default: `bg-emerald-100 text-emerald-700`
- Hover: `bg-emerald-600 text-white`

**Title**:
- Default: `gray-900`
- Hover: `emerald-600`

**Description**:
- Color: `gray-600`

---

## 📐 Spacing & Sizing

### About Page:

**Section Padding**: 
- Top/Bottom: `py-20` (5rem / 80px)
- Left/Right: `px-4 sm:px-6 lg:px-8`

**Max Width**: 
- Section: `max-w-7xl` (1280px)
- Intro: `max-w-3xl` (768px)
- Story: `max-w-3xl` (768px)

**Grid Gaps**:
- Mission/Vision: `gap-8`
- Values: `gap-6`

**Card Padding**:
- Mission/Vision: `p-8`
- Values: `p-6`
- Story: `p-8 lg:p-12`

### Programs Page:

**Section Padding**: 
- Top/Bottom: `py-20`
- Left/Right: `px-4 sm:px-6 lg:px-8`

**Max Width**: 
- Section: `max-w-7xl`
- Header: `max-w-3xl`

**Grid**:
- Columns: `md:grid-cols-2 lg:grid-cols-3`
- Gap: `gap-8`

**Card Padding**:
- Content area: `p-6`

**Image**:
- Aspect ratio: `aspect-video` (16:9)

---

## 🎭 Interactive States

### About Page Hover Effects:

**Mission/Vision Cards**:
```
Default:
- shadow-none
- title: gray-900

Hover:
- shadow-xl
- title: emerald-600 or blue-600
- slight lift
```

**Values Cards**:
```
Default:
- border-gray-200
- translate-y-0
- icon-bg: emerald-100
- icon-color: emerald-600

Hover:
- border-emerald-200
- translate-y: -8px
- shadow-xl
- icon-bg: emerald-600
- icon-color: white
- icon scale: 110%
```

### Programs Page Hover Effects:

**Program Cards**:
```
Default:
- shadow-sm
- image scale: 100%
- badge: emerald-100
- title: gray-900

Hover:
- shadow-xl
- image scale: 110%
- badge: emerald-600, text white
- title: emerald-600
```

---

## 📱 Mobile View (< 768px)

### About Page Mobile:

```
┌─────────────────────┐
│  About Resti...     │
│  Introduction text  │
└─────────────────────┘

┌─────────────────────┐
│ Our Mission         │
│ [Full width]        │
│ Text...             │
└─────────────────────┘

┌─────────────────────┐
│ Our Vision          │
│ [Full width]        │
│ Text...             │
└─────────────────────┘

┌──────────┬──────────┐
│Compassion│Community │
└──────────┴──────────┘
┌──────────┬──────────┐
│  Impact  │Excellence│
└──────────┴──────────┘

┌─────────────────────┐
│    Our Story        │
│ Story text...       │
└─────────────────────┘
```

### Programs Page Mobile:

```
┌─────────────────────┐
│   Our Programs      │
│   Description...    │
└─────────────────────┘

┌─────────────────────┐
│  [Program Image]    │
│  Category Badge     │
│  Program Title      │
│  Description...     │
└─────────────────────┘

┌─────────────────────┐
│  [Program Image]    │
│  Category Badge     │
│  Program Title      │
│  Description...     │
└─────────────────────┘

[More programs stacked]
```

---

## 🎬 Animation Sequence

### About Page (on scroll into view):

```
Time    Element
──────  ───────────────────────────
0ms     Section becomes visible
        ↓
100ms   Header fades in, translates up
        ↓
200ms   Mission card slides from left
        ↓
300ms   Vision card slides from right
        ↓
400ms   "Core Values" title fades in
        ↓
500ms   Value 1 fades in
        ↓
600ms   Value 2 fades in
        ↓
700ms   Value 3 fades in
        ↓
800ms   Value 4 fades in
        ↓
900ms   Story section fades in
```

### Programs Page (on scroll into view):

```
Time    Element
──────  ───────────────────────────
0ms     Section becomes visible
        ↓
100ms   Header fades in
        ↓
200ms   Program 1 fades in
        ↓
300ms   Program 2 fades in
        ↓
400ms   Program 3 fades in
        ↓
500ms   Program 4 fades in (if exists)
        
[100ms between each program]
```

---

## 🎨 Typography

### About Page:

**Section Title**:
- Size: `text-3xl lg:text-5xl`
- Weight: Default (bold from globals.css)
- Color: `gray-900`

**Introduction**:
- Size: `text-lg`
- Color: `gray-600`
- Leading: `leading-relaxed`

**Mission/Vision Titles**:
- Size: `text-2xl`
- Color: `gray-900`
- Hover: `emerald-600` or `blue-600`

**Mission/Vision Text**:
- Size: Default
- Color: `gray-700`
- Leading: `leading-relaxed`

**Values Title**:
- Size: `text-lg`
- Color: `gray-900`

**Values Description**:
- Size: `text-sm`
- Color: `gray-600`

### Programs Page:

**Section Title**:
- Size: `text-3xl lg:text-5xl`
- Color: `gray-900`

**Description**:
- Size: `text-lg`
- Color: `gray-600`

**Program Title**:
- Size: `text-xl`
- Color: `gray-900`
- Hover: `emerald-600`

**Category Badge**:
- Size: `text-xs`
- Transform: `uppercase` (if needed)

**Program Description**:
- Size: Default
- Color: `gray-600`
- Leading: `leading-relaxed`

---

## 📊 Loading States

### About Page Loading:

```
┌─────────────────────────────────────┐
│  ████████████ [gray shimmer bar]    │
│  ████████████████ [gray shimmer]    │
│  ██████████ [gray shimmer bar]      │
└─────────────────────────────────────┘
```

### Programs Page Loading:

```
        ┌─────────┐
        │    ○    │ [spinning loader]
        │  Loading│
        └─────────┘
```

---

## 🚫 Empty States

### Programs Page (no programs):

```
┌─────────────────────────────────────┐
│                                       │
│   No programs available at the        │
│   moment.                             │
│                                       │
└─────────────────────────────────────┘
```

---

## ✅ Quality Checklist

Use this to verify your pages look correct:

### About Page:
- [ ] Section title centered and large
- [ ] Introduction paragraph centered, max-width
- [ ] Mission card has emerald background gradient
- [ ] Vision card has blue background gradient
- [ ] Both cards side-by-side on desktop
- [ ] Both cards stacked on mobile
- [ ] 4 values cards in grid (4 cols desktop, 2 cols mobile)
- [ ] Each value has icon in colored circle
- [ ] Story section has gray background
- [ ] All text is readable and properly spaced
- [ ] Hover effects work (lift, shadow, colors)
- [ ] Animations trigger when scrolling to section

### Programs Page:
- [ ] Section title and description centered
- [ ] Programs in 3-column grid on desktop
- [ ] Programs in 2-column grid on tablet
- [ ] Programs in 1-column on mobile
- [ ] Each card has image at top (16:9 ratio)
- [ ] Category badge visible and styled
- [ ] Program title and description present
- [ ] Cards have subtle shadow
- [ ] Hover effects work (lift, image zoom, badge flip)
- [ ] Empty state shows if no programs
- [ ] Loading spinner shows while fetching

---

## 🎨 Design Principles Applied

1. **Visual Hierarchy**: Titles larger, descriptions smaller
2. **Color Coding**: Mission (emerald), Vision (blue), consistent throughout
3. **White Space**: Generous padding and margins
4. **Consistency**: Same border-radius, shadows, transitions
5. **Accessibility**: High contrast, readable fonts, proper structure
6. **Responsiveness**: Adapts to all screen sizes
7. **Feedback**: Hover states, loading states, empty states
8. **Performance**: Smooth 60 FPS animations

---

## 📸 Screenshot Checklist

Take screenshots to compare:

**About Page**:
1. Full section view (desktop)
2. Mission/Vision cards close-up
3. Values grid (all 4 cards)
4. Story section
5. Mobile view (stacked layout)
6. Hover state on value card

**Programs Page**:
1. Full section view (desktop)
2. Single program card close-up
3. Grid of 6 programs
4. Mobile view (stacked cards)
5. Hover state on card (image zoomed)
6. Empty state

---

**Use this guide to verify your pages match the expected design!** ✨

---

**Created**: Now  
**Purpose**: Visual reference for About & Programs pages  
**Status**: ✅ Complete guide
