# Mobile QA Checklist

## Viewport widths to validate
- [ ] 320 (iPhone SE)
- [ ] 360 (Android small)
- [ ] 375 (iPhone 12/13/14/15)
- [ ] 390 (iPhone 12/13/14 Pro)
- [ ] 414 (iPhone Pro Max older)
- [ ] 430 (iPhone 14/15 Pro Max)
- [ ] 768 (tablet portrait)
- [ ] 834 (iPad portrait)
- [ ] 1024 (tablet landscape)
- [ ] 1280 (small laptop)

## Browser matrix
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Android
- [ ] Edge Mobile

## Global responsive checks
- [ ] No horizontal overflow on app shell/page body
- [ ] No clipped cards, no overlapping content
- [ ] Filters remain readable and usable
- [ ] Modal opens fully in viewport and closes by overlay/button
- [ ] Table content scrolls horizontally inside container

## Sidebar behavior
- [ ] Hamburger opens sidebar on mobile
- [ ] Overlay closes sidebar
- [ ] Close button closes sidebar
- [ ] Nav item tap navigates and closes sidebar
- [ ] Active nav state visible
- [ ] All nav items reachable via vertical scrolling on small screens

## Forms and inputs
- [ ] Inputs/selects/textareas readable (>=16px on mobile)
- [ ] Date/month controls usable on iOS/Android
- [ ] Number/currency fields readable without clipping
- [ ] Footer action buttons wrap and remain tappable

## Auth screens
- [ ] Login/signup fit viewport width
- [ ] No clipping from brand panel/form column
- [ ] Password visibility toggle easily tappable

## Device buckets
- [ ] iPhone SE width class
- [ ] iPhone 12/13/14/15 width class
- [ ] iPhone Pro Max width class
- [ ] Android small phone
- [ ] Android large phone
- [ ] iPad/tablet portrait
- [ ] iPad/tablet landscape
