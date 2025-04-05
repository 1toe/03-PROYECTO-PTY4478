# Mobile Application Detailed View Specifications

## 1st view: Splash Screen / Loading View

* Pure white background (#FFFFFF) extending edge to edge
* Centered logo with vibrant blue (#4682FF) or deep purple (#783296) accents
* Animated loading spinner in vibrant blue (#4682FF), perfectly centered
* Clean minimalist design with proper spacing and alignment
* Elements positioned on invisible grid for visual balance

**Splash Screen connects to Authentication Screen**

## 2nd view: Authentication Screen

* Pure white background (#FFFFFF) with subtle shadow edges
* REGISTER button with vibrant blue background (#4682FF), white text (#FFFFFF), 8px rounded corners
* LOGIN button with white background (#FFFFFF), vibrant blue border and text (#4682FF), matching 8px rounded corners
* Both buttons perfectly aligned, same width, with 16px padding
* Input fields with subtle drop shadows, 8px rounded corners, light gray placeholder text
* User and password icons in deep purple (#783296) perfectly aligned with input fields
* Equal spacing between all elements (24px standard vertical spacing)

**Authentication Screen connects to Registration Process and Home View**

## 3rd view: Registration Process

* Pure white background (#FFFFFF) with consistent 24px margin on all sides
* Field labels in deep purple (#783296), 14px size, consistently aligned
* Text fields with white background (#FFFFFF), vibrant blue border (#4682FF), 8px rounded corners
* 16px inner padding in all text fields for comfortable text entry
* NEXT button with vibrant blue background (#4682FF), white text (#FFFFFF), 8px rounded corners
* Error messages in deep purple (#783296) appearing below respective fields with 8px top spacing
* Profile, email and security icons in deep purple (#783296), consistently sized at 24x24px
* Clear visual indication of multi-step process with step indicators

**Registration Process connects to Home View**

## 4th view: Home View / Main View

* Pure white background (#FFFFFF) with 16px standard margins
* Central carousel element with fresh mint background (#B4FFD2) or peachy pink (#FFB496)
* Card carousel with pure white cards (#FFFFFF), subtle drop shadows, 12px rounded corners
* List names in deep purple (#783296), 16px size, bold weight, consistently aligned
* "History" section title in deep purple (#783296), 18px size, semi-bold weight
* FAB (Floating Action Button) with vibrant blue background (#4682FF), white icon (#FFFFFF), perfect circular shape
* FAB positioned 24px from bottom edge and 24px from right edge, above bottom navigation
* Bottom navigation bar with pure white background (#FFFFFF), subtle top shadow
* Navigation icons (24x24px) and labels (12px) evenly spaced across bottom
* Non-selected icons and labels in deep purple (#783296)
* Selected icon and label in vibrant blue (#4682FF) with subtle indicator dot above

**Home View connects to AI Interaction, Catalog View, Map View and Profile View**

## 5th view: AI Personal Interaction

* Chat window with pure white background (#FFFFFF) and 16px margins
* User messages with fresh mint background (#B4FFD2), deep purple text (#783296), 12px rounded corners
* User message bubbles right-aligned with 8px internal padding
* AI messages with peachy pink background (#FFB496), deep purple text (#783296), 12px rounded corners
* AI message bubbles left-aligned with 8px internal padding
* 16px vertical spacing between message bubbles
* Input field with white background (#FFFFFF), light gray rounded border (8px), inner shadow when focused
* SEND button with vibrant blue icon (#4682FF) on white background (#FFFFFF), perfectly centered
* Virtual assistant icon in deep purple (#783296), 32x32px, positioned at top of chat
* Entire chat interface slides up from bottom with smooth animation

**AI Interaction connects to Home View**

## 6th view: Complete Catalog View

* Pure white background (#FFFFFF) with consistent 16px margins
* Search bar with white background (#FFFFFF), light gray rounded border (8px), magnifying glass icon in deep purple (#783296)
* Search suggestions with white background (#FFFFFF), deep purple text (#783296), vibrant blue highlight (#4682FF)
* Search suggestions appear in a card with subtle shadow, 8px rounded corners
* Category cards arranged in a grid (2 columns), white background (#FFFFFF), subtle elevation shadows
* Equal spacing (16px) between all category cards
* Category names in deep purple (#783296), centered within each card
* Category icons in deep purple (#783296), 48x48px, perfectly centered above text
* Each card perfectly square with consistent 12px rounded corners

**Complete Catalog View connects to Home View and Specific Category View**

## 7th view: Specific Category View

* Pure white background (#FFFFFF) with consistent 16px margins
* Product cards in white (#FFFFFF) with subtle elevation shadows and 12px rounded corners
* Product image area taking up 60% of card height
* Product name in deep purple (#783296), 14px size, semi-bold weight, with 8px margins
* Price in vibrant blue (#4682FF), 16px size, bold weight, properly aligned
* "Add to List" button with fresh mint background (#B4FFD2), deep purple icon (#783296), 8px rounded corners
* "See Details" button with vibrant blue text (#4682FF), no background, properly aligned
* "Filters" button with white background (#FFFFFF), deep purple border and text (#783296), 8px rounded corners
* Product icons in deep purple (#783296), consistently sized and aligned
* All cards follow a strict grid layout with 16px gutters

**Specific Category View connects to Complete Catalog View**

## 8th view: Map View

* Map taking up full screen with appropriate padding for bottom navigation
* User location marker in vibrant blue (#4682FF), pulsating animation
* Store location markers in deep purple (#783296), subtle drop shadow
* Pop-up window with white background (#FFFFFF), 12px rounded corners, subtle elevation shadow
* Store name in deep purple (#783296), 16px size, bold weight, centered in pop-up
* "Filter Catalog by this Store" button with fresh mint background (#B4FFD2), deep purple text (#783296), 8px rounded corners
* Location and store icons in respective colors, consistently sized at 24x24px
* Map controls aligned to right side with 16px spacing

**Map View connects to Home View and Complete Catalog View**

## 9th view: User Profile View

* Pure white background (#FFFFFF) with consistent 16px margins
* Section titles in deep purple (#783296), 18px size, bold weight, left-aligned
* Data labels in deep purple (#783296), 14px size, regular weight
* Data values in vibrant blue (#4682FF), 14px size, medium weight
* All information organized in cards with subtle elevation shadows and 12px rounded corners
* "Edit" buttons with vibrant blue icon (#4682FF), perfectly aligned right
* "Create New List" button with fresh mint background (#B4FFD2), deep purple icon (#783296), 8px rounded corners
* Configuration options with deep purple text (#783296), active switches in vibrant blue (#4682FF)
* All switches and interactive elements consistently sized and aligned
* "Log Out" button with peachy pink background (#FFB496), white text (#FFFFFF), 8px rounded corners
* User and settings icons in deep purple (#783296), consistently sized at 24x24px
* Clear visual hierarchy with 24px spacing between different sections

**User Profile View connects to Home View and Authentication Screen**

## Bottom Navigation (present in views 4-9)

* Pure white background (#FFFFFF) with subtle top shadow
* Height of 56px, extending full width of screen
* Icons sized at 24x24px, evenly distributed (typically 4-5 icons)
* Labels in 10px font size, centered below respective icons
* Non-selected icons and labels in deep purple (#783296)
* Selected icon and label in vibrant blue (#4682FF) with subtle indicator dot
* Smooth animation when switching between tabs
* Maintains consistent positioning across all connected screens
* Provides quick access to Home, Catalog, Map and Profile views

## Color Palette Summary

* Vibrant Blue → RGB (70, 130, 255) → HEX #4682FF
* Peachy Pink → RGB (255, 180, 150) → HEX #FFB496
* Intense Lavender → RGB (190, 140, 255) → HEX #BE8CFF
* Fresh Mint → RGB (180, 255, 210) → HEX #B4FFD2
* Pure White → RGB (255, 255, 255) → HEX #FFFFFF
* Deep Purple → RGB (120, 50, 150) → HEX #783296
