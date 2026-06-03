export interface DeviceSeoAlternative {
  href: string;
  label: string;
  reason: string;
}

export interface DeviceSeoRecommendation {
  choose: string[];
  skip: string[];
  alternatives: DeviceSeoAlternative[];
  bottomLine: string;
}

const recommendations: Record<string, DeviceSeoRecommendation> = {
  'iphone-17': {
    choose: [
      'You want the newest standard iPhone size without moving into a heavy Pro Max body.',
      'You care more about smoother daily scrolling and long software support than maximum camera hardware.',
      'You are upgrading from an iPhone 13, iPhone 14, or older 6.1-inch phone and want a familiar but slightly roomier screen.',
    ],
    skip: [
      'You already use an iPhone 15 or iPhone 16 and only care about screen size, because the physical jump is modest.',
      'You need the best battery headroom Apple offers, where the Pro Max body still makes more sense.',
      'You want the thinnest pocket feel possible and are willing to accept smaller battery capacity.',
    ],
    alternatives: [
      { href: '/iphone-17-pro-screen-size', label: 'iPhone 17 Pro', reason: 'same 6.3-inch class with Pro display and camera features' },
      { href: '/iphone-17-air-screen-size', label: 'iPhone 17 Air', reason: 'thinner body if pocket feel matters more than battery' },
      { href: '/iphone-16-screen-size', label: 'iPhone 16', reason: 'similar mainstream size if price matters more than the latest model' },
    ],
    bottomLine: 'Choose iPhone 17 if you want the safest current iPhone size: modern, manageable, and large enough without becoming a two-hand phone.',
  },
  'iphone-17-air': {
    choose: [
      'You want a larger-than-base iPhone screen in the lightest, thinnest body Apple offers.',
      'Pocket comfort, slim design, and one-hand reach matter more than maximum battery capacity.',
      'You mostly browse, message, read, and stream in shorter sessions rather than gaming for hours.',
    ],
    skip: [
      'You are a heavy user who regularly drains a phone before evening.',
      'You want the most durable-feeling phone body or the strongest camera setup.',
      'You prefer predictable all-day battery over a design-first device.',
    ],
    alternatives: [
      { href: '/iphone-17-screen-size', label: 'iPhone 17', reason: 'more balanced battery and size trade-off' },
      { href: '/iphone-17-pro-screen-size', label: 'iPhone 17 Pro', reason: 'same compact flagship class with stronger performance features' },
      { href: '/iphone-16-plus-screen-size', label: 'iPhone 16 Plus', reason: 'larger battery-focused option with a bigger screen' },
    ],
    bottomLine: 'Choose iPhone 17 Air for design and pocket feel; skip it if battery confidence is your main reason to upgrade.',
  },
  'iphone-17-pro': {
    choose: [
      'You want Pro features without accepting the width and weight of a Pro Max.',
      'You use the phone for photos, video, and high-refresh scrolling but still care about pocket comfort.',
      'You are deciding between flagship performance and daily handling, and handling wins by a small margin.',
    ],
    skip: [
      'You watch long videos, edit on-device, or travel often enough that the Pro Max battery would matter.',
      'You mainly want a good screen and do not need Pro cameras or always-on display features.',
      'You have large hands and already know smaller Pro phones feel cramped for typing or reading.',
    ],
    alternatives: [
      { href: '/iphone-17-pro-max-screen-size', label: 'iPhone 17 Pro Max', reason: 'larger canvas and stronger battery if two-hand use is acceptable' },
      { href: '/iphone-17-screen-size', label: 'iPhone 17', reason: 'same size class for users who do not need Pro hardware' },
      { href: '/iphone-16-pro-screen-size', label: 'iPhone 16 Pro', reason: 'similar handling if you are comparing generation value' },
    ],
    bottomLine: 'Choose iPhone 17 Pro if you want the strongest small flagship iPhone rather than the biggest iPhone.',
  },
  'iphone-17-pro-max': {
    choose: [
      'Your phone is a primary video, reading, navigation, or work screen and you want the largest iPhone canvas.',
      'Battery life is a top priority and you accept a heavier phone in exchange.',
      'You usually use two hands or a grip and do not mind a phone that is obvious in pockets.',
    ],
    skip: [
      'You often text while walking, use tight pockets, or prefer a phone that disappears in one hand.',
      'You want Pro features but not the 6.9-inch body size.',
      'You are upgrading only for screen size from another recent Pro Max, because the practical handling class is the same.',
    ],
    alternatives: [
      { href: '/iphone-17-pro-screen-size', label: 'iPhone 17 Pro', reason: 'same Pro tier in a more manageable body' },
      { href: '/iphone-16-pro-max-screen-size', label: 'iPhone 16 Pro Max', reason: 'similar large-phone feel if generation price matters' },
      { href: '/samsung-galaxy-s26-ultra-screen-size', label: 'Galaxy S26 Ultra', reason: 'large-screen alternative with a different shape and ecosystem' },
    ],
    bottomLine: 'Choose iPhone 17 Pro Max only if screen area and battery are worth the extra weight every day.',
  },
  'iphone-16': {
    choose: [
      'You want a familiar mainstream iPhone size with good pocket comfort and lower cost than the newest model.',
      'You mostly use the phone for messaging, photos, maps, browsing, and casual video.',
      'You are coming from an older 6.1-inch iPhone and want an easy transition.',
    ],
    skip: [
      'You want the smoothest display available in the standard iPhone line.',
      'You use your phone as a heavy video or gaming device and want more battery margin.',
      'You are choosing mainly for longevity and the iPhone 17 price gap is small.',
    ],
    alternatives: [
      { href: '/iphone-17-screen-size', label: 'iPhone 17', reason: 'newer standard iPhone with a slightly larger display class' },
      { href: '/iphone-16-plus-screen-size', label: 'iPhone 16 Plus', reason: 'larger battery and screen for media use' },
      { href: '/iphone-15-screen-size', label: 'iPhone 15', reason: 'similar compact feel if price is the main factor' },
    ],
    bottomLine: 'Choose iPhone 16 if value and manageable size matter more than having the newest display improvements.',
  },
  'iphone-16-plus': {
    choose: [
      'You want a large iPhone screen and strong battery without paying for Pro Max features.',
      'You watch video, read, navigate, or type often enough to benefit from a 6.7-inch display.',
      'You prefer a lighter large phone over the heavier Pro Max class.',
    ],
    skip: [
      'You want high-refresh display smoothness or Pro camera hardware.',
      'You struggle with wide phones and need easy one-handed use.',
      'You are choosing purely for portability, where the base iPhone is easier to live with.',
    ],
    alternatives: [
      { href: '/iphone-16-screen-size', label: 'iPhone 16', reason: 'same generation in a smaller body' },
      { href: '/iphone-16-pro-max-screen-size', label: 'iPhone 16 Pro Max', reason: 'larger Pro option with the strongest feature set' },
      { href: '/iphone-17-air-screen-size', label: 'iPhone 17 Air', reason: 'large-ish screen with a much thinner design focus' },
    ],
    bottomLine: 'Choose iPhone 16 Plus if you want big-screen battery value, not a full Pro Max package.',
  },
  'iphone-16-pro': {
    choose: [
      'You want Pro features in a phone that still fits normal pockets better than a Pro Max.',
      'You care about 120Hz, camera hardware, and premium display quality more than maximum screen size.',
      'You prefer a compact flagship for daily carry but do not want to drop to the base model.',
    ],
    skip: [
      'You do long video sessions or travel days where Pro Max battery would remove charging anxiety.',
      'You want the cheapest route to a modern iPhone screen.',
      'You know you prefer larger keyboards and more reading space.',
    ],
    alternatives: [
      { href: '/iphone-16-pro-max-screen-size', label: 'iPhone 16 Pro Max', reason: 'same Pro generation with a much larger screen' },
      { href: '/iphone-17-pro-screen-size', label: 'iPhone 17 Pro', reason: 'newer compact Pro option' },
      { href: '/iphone-16-screen-size', label: 'iPhone 16', reason: 'similar daily size if Pro features are not essential' },
    ],
    bottomLine: 'Choose iPhone 16 Pro if you want the Pro experience without committing to a large-phone lifestyle.',
  },
  'iphone-16-pro-max': {
    choose: [
      'You want a maximum-size iPhone screen for media, camera work, reading, and travel battery life.',
      'You are comfortable using two hands and carrying a heavier phone.',
      'You want a large Pro iPhone but do not need the newest 17 Pro Max specifically.',
    ],
    skip: [
      'You are sensitive to weight or pocket bulge.',
      'You mostly want a larger screen but not Pro cameras or Pro pricing.',
      'You already own a recent Pro Max and are not gaining a major handling change.',
    ],
    alternatives: [
      { href: '/iphone-17-pro-max-screen-size', label: 'iPhone 17 Pro Max', reason: 'newer maximum-size iPhone' },
      { href: '/iphone-16-pro-screen-size', label: 'iPhone 16 Pro', reason: 'smaller Pro model with easier handling' },
      { href: '/iphone-16-plus-screen-size', label: 'iPhone 16 Plus', reason: 'large screen and battery without Pro Max weight or price' },
    ],
    bottomLine: 'Choose iPhone 16 Pro Max if you want proven large-screen iPhone performance and can live with the size every day.',
  },
  'iphone-15': {
    choose: [
      'You want a modern iPhone size that is still easy to pocket and cheaper than newer models.',
      'You mostly need a reliable daily phone for messaging, camera, maps, browsing, and casual media.',
      'You are upgrading from an older iPhone and want a familiar 6.1-inch class.',
    ],
    skip: [
      'You want high-refresh scrolling or the latest standard iPhone display features.',
      'You are a heavy battery user who would benefit from a Plus or Pro Max body.',
      'You use the phone as your main reading or video device and want more screen area.',
    ],
    alternatives: [
      { href: '/iphone-16-screen-size', label: 'iPhone 16', reason: 'newer compact mainstream option' },
      { href: '/iphone-15-plus-screen-size', label: 'iPhone 15 Plus', reason: 'same generation with more screen and battery' },
      { href: '/iphone-15-pro-screen-size', label: 'iPhone 15 Pro', reason: 'same compact class with Pro display and camera features' },
    ],
    bottomLine: 'Choose iPhone 15 if you want a practical compact iPhone and the price gap to newer models is meaningful.',
  },
  'iphone-15-plus': {
    choose: [
      'You want a larger iPhone screen and strong battery while avoiding Pro Max pricing.',
      'You watch videos, read, or use maps often enough that a 6.7-inch screen helps.',
      'You prefer a big but simpler iPhone over a heavier Pro model.',
    ],
    skip: [
      'You want 120Hz smoothness or Pro camera controls.',
      'You need a phone that is easy to use one-handed.',
      'You are comparing with newer Plus or Air models and the price difference is small.',
    ],
    alternatives: [
      { href: '/iphone-15-screen-size', label: 'iPhone 15', reason: 'same generation with easier carry' },
      { href: '/iphone-16-plus-screen-size', label: 'iPhone 16 Plus', reason: 'newer large mainstream iPhone' },
      { href: '/iphone-15-pro-max-screen-size', label: 'iPhone 15 Pro Max', reason: 'large Pro option if camera and display matter' },
    ],
    bottomLine: 'Choose iPhone 15 Plus if battery and screen size matter more than Pro features.',
  },
  'iphone-15-pro': {
    choose: [
      'You want Pro display and camera features in a more pocketable body.',
      'You prefer the 6.1-inch handling class and do not want a large flagship.',
      'You care about premium features but still use your phone heavily one-handed.',
    ],
    skip: [
      'You need the longest battery life in the iPhone 15 generation.',
      'You watch or edit a lot of video on the phone and want a larger canvas.',
      'You only care about screen size and can get enough value from the base iPhone 15.',
    ],
    alternatives: [
      { href: '/iphone-15-pro-max-screen-size', label: 'iPhone 15 Pro Max', reason: 'same Pro generation with more screen and battery' },
      { href: '/iphone-16-pro-screen-size', label: 'iPhone 16 Pro', reason: 'newer compact Pro size class' },
      { href: '/iphone-15-screen-size', label: 'iPhone 15', reason: 'similar compact size with lower cost' },
    ],
    bottomLine: 'Choose iPhone 15 Pro if you want a compact Pro iPhone and can accept less battery margin than Pro Max.',
  },
  'iphone-15-pro-max': {
    choose: [
      'You want a large iPhone display for photos, video, maps, reading, and stronger battery life.',
      'You are comfortable with a 6.7-inch phone and two-hand use.',
      'You want Pro Max benefits but are comparing against newer, more expensive models.',
    ],
    skip: [
      'You are sensitive to phone weight or want easy one-hand use.',
      'You only need a large screen and not Pro camera hardware.',
      'You are moving from another Pro Max and expect a smaller-feeling phone.',
    ],
    alternatives: [
      { href: '/iphone-16-pro-max-screen-size', label: 'iPhone 16 Pro Max', reason: 'newer Pro Max with a larger 6.9-inch class' },
      { href: '/iphone-15-pro-screen-size', label: 'iPhone 15 Pro', reason: 'same Pro generation in a smaller body' },
      { href: '/iphone-15-plus-screen-size', label: 'iPhone 15 Plus', reason: 'large screen and battery with simpler hardware' },
    ],
    bottomLine: 'Choose iPhone 15 Pro Max if you want large-screen iPhone value and can handle the size.',
  },
  'samsung-galaxy-s26-ultra': {
    choose: [
      'You want the largest Android flagship screen class with strong multitasking and reading space.',
      'You prefer a wide, squared-off phone shape for productivity, notes, and split-screen use.',
      'You are comparing against iPhone Pro Max and want Android flexibility more than Apple ecosystem fit.',
    ],
    skip: [
      'You dislike wide phones or frequently use your phone one-handed.',
      'You mainly want a normal daily phone and do not need Ultra-level size or features.',
      'You prefer a lighter pocket feel over maximum display area.',
    ],
    alternatives: [
      { href: '/samsung-galaxy-s26-plus-screen-size', label: 'Galaxy S26+', reason: 'large Samsung option with a less extreme body' },
      { href: '/iphone-17-pro-max-screen-size', label: 'iPhone 17 Pro Max', reason: 'large-screen alternative in the Apple ecosystem' },
      { href: '/google-pixel-10-pro-xl-screen-size', label: 'Google Pixel 10 Pro XL', reason: 'large Android alternative with a different software focus' },
    ],
    bottomLine: 'Choose Galaxy S26 Ultra if you want a phone that behaves more like a pocket tablet than a compact handset.',
  },
  '27-inch-monitor': {
    choose: [
      'You want the safest all-around desktop monitor size for office work, coding, gaming, and browsing.',
      'Your desk depth is normal and you sit roughly an arm length from the screen.',
      'You want 1440p sharpness without the scaling complexity of many 4K setups.',
    ],
    skip: [
      'You work heavily in timelines, huge spreadsheets, or dashboards that benefit from ultrawide space.',
      'You sit very close to the monitor and prefer faster visual scanning for esports.',
      'You want a 4K workspace with larger UI and have enough desk depth for 32 inches.',
    ],
    alternatives: [
      { href: '/24-inch-monitor-screen-size', label: '24-inch monitor', reason: 'smaller desk and esports-friendly option' },
      { href: '/32-inch-monitor-screen-size', label: '32-inch monitor', reason: 'larger 4K productivity choice' },
      { href: '/34-inch-ultrawide-monitor-screen-size', label: '34-inch ultrawide', reason: 'more horizontal workspace for multitasking' },
    ],
    bottomLine: 'Choose a 27-inch monitor if you want the most balanced monitor size with the fewest trade-offs.',
  },
  '32-inch-monitor': {
    choose: [
      'You want a larger 4K workspace for documents, creative tools, code, and side-by-side windows.',
      'Your desk has enough depth that the screen will not dominate your field of view.',
      'You prefer bigger UI and more workspace over competitive gaming speed.',
    ],
    skip: [
      'Your desk is shallow or you sit very close to the display.',
      'You mostly play fast esports where scanning the entire screen quickly matters.',
      'You do not want to manage scaling, window layout, or a physically larger monitor footprint.',
    ],
    alternatives: [
      { href: '/27-inch-monitor-screen-size', label: '27-inch monitor', reason: 'more balanced daily size for typical desks' },
      { href: '/34-inch-ultrawide-monitor-screen-size', label: '34-inch ultrawide', reason: 'wider multitasking without as much vertical height' },
      { href: '/38-inch-ultrawide-monitor-screen-size', label: '38-inch ultrawide', reason: 'larger workspace for advanced productivity setups' },
    ],
    bottomLine: 'Choose a 32-inch monitor when you specifically want a bigger 4K desk experience, not just a larger version of 27 inches.',
  },
  '34-inch-ultrawide-monitor': {
    choose: [
      'You want one wide workspace for coding, timelines, spreadsheets, and multi-window work.',
      'You dislike dual-monitor bezels and want a cleaner single-screen setup.',
      'Your work benefits more from horizontal room than from extra vertical height.',
    ],
    skip: [
      'You mainly play competitive games or use apps that do not handle ultrawide layouts well.',
      'You need true 4K vertical detail for photo, video, or design review.',
      'Your desk is narrow and cannot comfortably fit the extra width.',
    ],
    alternatives: [
      { href: '/32-inch-monitor-screen-size', label: '32-inch 4K monitor', reason: 'sharper standard-format productivity option' },
      { href: '/27-inch-monitor-screen-size', label: '27-inch monitor', reason: 'simpler all-around choice for most desks' },
      { href: '/38-inch-ultrawide-monitor-screen-size', label: '38-inch ultrawide', reason: 'more vertical room if 34 inches feels short' },
    ],
    bottomLine: 'Choose a 34-inch ultrawide if your real problem is horizontal workspace, not raw pixel density.',
  },
  '55-inch-tv': {
    choose: [
      'You sit around 6 to 8 feet away and want a TV that fits most living rooms or bedrooms.',
      'You need a screen that feels clearly larger than 43 or 50 inches without dominating the wall.',
      'You watch mixed content: streaming, sports, casual gaming, and everyday TV.',
    ],
    skip: [
      'Your main seat is closer to 9 or 10 feet and you want a cinematic feel.',
      'You have a wide media wall where a 55-inch screen will look undersized.',
      'You are replacing an existing 55-inch TV and want the upgrade to feel obvious.',
    ],
    alternatives: [
      { href: '/65-inch-tv-screen-size', label: '65-inch TV', reason: 'stronger living-room upgrade for common seating distances' },
      { href: '/50-inch-tv-screen-size', label: '50-inch TV', reason: 'slightly easier fit for smaller rooms' },
      { href: '/75-inch-tv-screen-size', label: '75-inch TV', reason: 'more immersive choice for larger seating distances' },
    ],
    bottomLine: 'Choose a 55-inch TV for smaller living rooms and bedrooms; size up to 65 inches if the room allows it.',
  },
  '65-inch-tv': {
    choose: [
      'You sit roughly 7 to 10 feet away and want the modern living-room sweet spot.',
      'You watch movies, sports, and console games enough to benefit from a more immersive screen.',
      'Your wall and furniture layout can visually support a screen over 56 inches wide.',
    ],
    skip: [
      'Your couch is very close to the TV or the room is narrow.',
      'You are mounting above a small console where the screen will overpower the setup.',
      'You want a theater-like feel at 10 feet or more, where 75 inches may be the better target.',
    ],
    alternatives: [
      { href: '/55-inch-tv-screen-size', label: '55-inch TV', reason: 'safer fit for apartments and closer seating' },
      { href: '/75-inch-tv-screen-size', label: '75-inch TV', reason: 'bigger jump for cinematic living rooms' },
      { href: '/120-inch-projector-screen-size', label: '120-inch projector screen', reason: 'dedicated-theater alternative when room control is possible' },
    ],
    bottomLine: 'Choose a 65-inch TV if you want the most reliable big-TV upgrade for a normal living room.',
  },
  '120-inch-projector-screen': {
    choose: [
      'You have a dedicated or semi-dedicated room with controlled light and enough throw distance.',
      'You want a true cinema-scale image that even very large TVs cannot match.',
      'Your seating distance is around 12 feet or more and wall width is not the constraint.',
    ],
    skip: [
      'You watch mostly with lights on or in a bright living room.',
      'You need a simple always-on display for casual daytime TV.',
      'Your projector brightness, throw ratio, or seating distance cannot support the size comfortably.',
    ],
    alternatives: [
      { href: '/100-inch-projector-screen-size', label: '100-inch projector screen', reason: 'safer first projector size for mixed-use rooms' },
      { href: '/150-inch-projector-screen-size', label: '150-inch projector screen', reason: 'larger dedicated-theater option' },
      { href: '/85-inch-tv-screen-size', label: '85-inch TV', reason: 'brighter, simpler alternative for normal living rooms' },
    ],
    bottomLine: 'Choose a 120-inch projector screen when the room is built around movie nights, not casual daytime TV.',
  },
};

export function getDeviceSeoRecommendation(deviceId: string): DeviceSeoRecommendation | undefined {
  return recommendations[deviceId];
}
