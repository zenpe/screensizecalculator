// Utility functions for generating unique comparison content

// Phone-specific attributes
interface PhoneSpecs {
  weight?: number;
  battery?: number;
  dimensions?: {
    height: number;
    width: number;
    depth: number;
  };
  refreshRate?: number;
  screenType?: string;
  peakBrightness?: number;
  hdr?: boolean;
  alwaysOnDisplay?: boolean;
}

interface Device {
  id: string;
  name: string;
  diagonal: number;
  ratio: number;
  category: string;
  resolution?: string;
  phone?: PhoneSpecs;
}

interface ComparisonDimensions {
  width: number;
  height: number;
}

/**
 * Generate a unique 200-300 word description for a comparison
 */
export function generateComparisonDescription(
  deviceA: Device,
  deviceB: Device,
  areaA: number,
  areaB: number,
  dimsA: ComparisonDimensions,
  dimsB: ComparisonDimensions
): string {
  const larger = areaA > areaB ? deviceA : deviceB;
  const smaller = areaA > areaB ? deviceB : deviceA;
  const largerArea = Math.max(areaA, areaB);
  const smallerArea = Math.min(areaA, areaB);

  const sizeDiff = Math.abs(deviceA.diagonal - deviceB.diagonal);
  const areaDiff = ((largerArea - smallerArea) / smallerArea) * 100;
  const widthDiff = Math.abs(dimsA.width - dimsB.width);
  const heightDiff = Math.abs(dimsA.height - dimsB.height);

  let description = `When comparing the ${deviceA.name} and ${deviceB.name}, `;

  // Size difference analysis
  if (sizeDiff > 3) {
    description += `there's a significant ${sizeDiff.toFixed(1)}-inch difference in diagonal screen size. `;
    description += `The ${larger.name} measures ${larger.diagonal}" diagonally, while the ${smaller.name} comes in at ${smaller.diagonal}". `;
  } else if (sizeDiff > 1) {
    description += `the screens are relatively close in size, with a ${sizeDiff.toFixed(1)}" difference in diagonal measurement. `;
  } else {
    description += `both devices feature nearly identical screen sizes at ${deviceA.diagonal}" and ${deviceB.diagonal}" respectively. `;
  }

  // Area difference
  if (areaDiff > 20) {
    description += `In terms of actual viewing area, the ${larger.name} provides ${areaDiff.toFixed(0)}% more screen real estate, `;
    description += `offering ${largerArea.toFixed(1)} square inches compared to ${smallerArea.toFixed(1)} square inches. `;
  } else if (areaDiff > 5) {
    description += `The ${larger.name} offers ${areaDiff.toFixed(0)}% more screen area, which translates to a noticeable difference in daily use. `;
  } else {
    description += `Both devices provide nearly identical screen areas, making them comparable in terms of viewing space. `;
  }

  // Dimension specifics
  if (widthDiff > 1 || heightDiff > 1) {
    description += `The ${larger.name} is ${widthDiff.toFixed(1)}" wider and ${heightDiff.toFixed(1)}" taller, `;
    description += `which can impact portability and how the device fits in your hand or on your desk. `;
  }

  // Category-specific insights
  if (deviceA.category === 'phone' || deviceB.category === 'phone') {
    description += `For smartphone users, this size difference affects one-handed usability, pocket fit, and media consumption experience. `;
    if (larger.diagonal > 6.5) {
      description += `The larger ${larger.name} excels at video watching and productivity but may be challenging for one-handed use. `;
    }
    if (smaller.diagonal < 6.3) {
      description += `The more compact ${smaller.name} offers better portability and easier one-handed operation. `;
    }
  } else if (deviceA.category === 'tv' || deviceB.category === 'tv') {
    description += `For TV viewing, this size difference significantly impacts your optimal viewing distance and room compatibility. `;
    description += `The ${larger.name} is better suited for larger rooms with viewing distances of ${(larger.diagonal * 1.5 / 12).toFixed(1)}-${(larger.diagonal * 2.5 / 12).toFixed(1)} feet, `;
    description += `while the ${smaller.name} works well in smaller spaces at ${(smaller.diagonal * 1.5 / 12).toFixed(1)}-${(smaller.diagonal * 2.5 / 12).toFixed(1)} feet away. `;
  } else if (deviceA.category === 'monitor' || deviceB.category === 'monitor') {
    description += `For desktop use, the ${larger.name} provides more workspace for multitasking and productivity, `;
    description += `while the ${smaller.name} may be more suitable for smaller desks or closer viewing distances. `;
  }

  return description;
}

/**
 * Generate use case scenarios based on device category
 */
export function generateUseCaseScenarios(deviceA: Device, deviceB: Device) {
  const category = deviceA.category;

  if (category === 'phone') {
    return [
      {
        icon: '👋',
        title: 'One-Handed Use',
        deviceA: deviceA.diagonal < 6.5 ? 'Comfortable' : 'Challenging',
        deviceB: deviceB.diagonal < 6.5 ? 'Comfortable' : 'Challenging',
        description: 'Ease of reaching all corners with your thumb'
      },
      {
        icon: '🎬',
        title: 'Video Watching',
        deviceA: deviceA.diagonal > 6.5 ? 'Excellent' : 'Good',
        deviceB: deviceB.diagonal > 6.5 ? 'Excellent' : 'Good',
        description: 'Immersive experience for movies and videos'
      },
      {
        icon: '👖',
        title: 'Pocket Fit',
        deviceA: deviceA.diagonal < 6.3 ? 'Fits easily' : 'Tight fit',
        deviceB: deviceB.diagonal < 6.3 ? 'Fits easily' : 'Tight fit',
        description: 'How well it fits in standard pockets'
      },
      {
        icon: '📖',
        title: 'Reading & Browsing',
        deviceA: deviceA.diagonal > 6.4 ? 'More content visible' : 'Standard',
        deviceB: deviceB.diagonal > 6.4 ? 'More content visible' : 'Standard',
        description: 'Amount of text and content visible at once'
      }
    ];
  } else if (category === 'tv') {
    return [
      {
        icon: '🛋️',
        title: 'Small Room (10x10 ft)',
        deviceA: deviceA.diagonal < 50 ? 'Perfect' : deviceA.diagonal < 65 ? 'Good' : 'Too large',
        deviceB: deviceB.diagonal < 50 ? 'Perfect' : deviceB.diagonal < 65 ? 'Good' : 'Too large',
        description: 'Bedroom or small living space'
      },
      {
        icon: '🏠',
        title: 'Medium Room (12x15 ft)',
        deviceA: deviceA.diagonal >= 50 && deviceA.diagonal <= 65 ? 'Ideal' : 'Consider size',
        deviceB: deviceB.diagonal >= 50 && deviceB.diagonal <= 65 ? 'Ideal' : 'Consider size',
        description: 'Standard living room setup'
      },
      {
        icon: '🎭',
        title: 'Large Room (15x20 ft)',
        deviceA: deviceA.diagonal >= 65 ? 'Perfect' : 'May feel small',
        deviceB: deviceB.diagonal >= 65 ? 'Perfect' : 'May feel small',
        description: 'Open concept or home theater'
      },
      {
        icon: '🎮',
        title: 'Gaming',
        deviceA: deviceA.diagonal >= 55 ? 'Immersive' : 'Good',
        deviceB: deviceB.diagonal >= 55 ? 'Immersive' : 'Good',
        description: 'Console and PC gaming experience'
      }
    ];
  } else if (category === 'monitor') {
    return [
      {
        icon: '💼',
        title: 'Productivity',
        deviceA: deviceA.diagonal >= 27 ? 'Excellent' : 'Good',
        deviceB: deviceB.diagonal >= 27 ? 'Excellent' : 'Good',
        description: 'Multitasking and workspace'
      },
      {
        icon: '🎮',
        title: 'Gaming',
        deviceA: deviceA.diagonal >= 24 && deviceA.diagonal <= 27 ? 'Optimal' : 'Good',
        deviceB: deviceB.diagonal >= 24 && deviceB.diagonal <= 27 ? 'Optimal' : 'Good',
        description: 'Competitive and casual gaming'
      },
      {
        icon: '🎨',
        title: 'Creative Work',
        deviceA: deviceA.diagonal >= 27 ? 'More canvas space' : 'Standard',
        deviceB: deviceB.diagonal >= 27 ? 'More canvas space' : 'Standard',
        description: 'Photo/video editing and design'
      },
      {
        icon: '📏',
        title: 'Desk Space',
        deviceA: deviceA.diagonal <= 24 ? 'Compact' : deviceA.diagonal <= 27 ? 'Standard' : 'Needs space',
        deviceB: deviceB.diagonal <= 24 ? 'Compact' : deviceB.diagonal <= 27 ? 'Standard' : 'Needs space',
        description: 'Physical footprint on your desk'
      }
    ];
  } else if (category === 'tablet') {
    return [
      {
        icon: '📖',
        title: 'Reading',
        deviceA: deviceA.diagonal >= 10 ? 'Magazine-like' : 'Book-like',
        deviceB: deviceB.diagonal >= 10 ? 'Magazine-like' : 'Book-like',
        description: 'E-books and digital magazines'
      },
      {
        icon: '✈️',
        title: 'Portability',
        deviceA: deviceA.diagonal < 10 ? 'Highly portable' : 'Less portable',
        deviceB: deviceB.diagonal < 10 ? 'Highly portable' : 'Less portable',
        description: 'Easy to carry and travel with'
      },
      {
        icon: '🎬',
        title: 'Media Consumption',
        deviceA: deviceA.diagonal >= 11 ? 'Immersive' : 'Good',
        deviceB: deviceB.diagonal >= 11 ? 'Immersive' : 'Good',
        description: 'Streaming and video playback'
      },
      {
        icon: '✍️',
        title: 'Note Taking',
        deviceA: deviceA.diagonal >= 11 ? 'More writing space' : 'Compact',
        deviceB: deviceB.diagonal >= 11 ? 'More writing space' : 'Compact',
        description: 'Digital note-taking and sketching'
      }
    ];
  }

  return [];
}

/**
 * Generate specific recommendations for each device
 */
export function generateRecommendations(deviceA: Device, deviceB: Device, areaA: number, areaB: number) {
  const larger = areaA > areaB ? deviceA : deviceB;
  const smaller = areaA > areaB ? deviceB : deviceA;
  const largerArea = Math.max(areaA, areaB);
  const smallerArea = Math.min(areaA, areaB);
  const areaDiff = ((largerArea - smallerArea) / smallerArea) * 100;

  const recommendations = {
    larger: [] as string[],
    smaller: [] as string[]
  };

  if (deviceA.category === 'phone' || deviceB.category === 'phone') {
    // Larger phone recommendations
    if (larger.diagonal > 6.7) {
      recommendations.larger.push('You prioritize screen size for media and productivity');
      recommendations.larger.push('You typically use your phone with two hands');
      recommendations.larger.push('You want the best viewing experience for videos and games');
    } else if (larger.diagonal > 6.3) {
      recommendations.larger.push('You want a balance of screen size and usability');
      recommendations.larger.push('You enjoy watching videos and browsing on your phone');
      recommendations.larger.push('You prefer a larger display for reading and typing');
    } else {
      recommendations.larger.push('You want a slightly larger screen for better visibility');
      recommendations.larger.push('You value the extra screen space for daily tasks');
      recommendations.larger.push('You prefer more content visible at once');
    }
    // Smaller phone recommendations
    if (smaller.diagonal < 6.1) {
      recommendations.smaller.push('You prefer one-handed operation and portability');
      recommendations.smaller.push('You want a phone that fits comfortably in pockets');
      recommendations.smaller.push('You value ease of use over maximum screen size');
    } else if (smaller.diagonal < 6.5) {
      recommendations.smaller.push('You want a more manageable device size');
      recommendations.smaller.push('You prefer easier one-handed use');
      recommendations.smaller.push('You value portability without sacrificing too much screen');
    } else {
      recommendations.smaller.push('You want a slightly more compact option');
      recommendations.smaller.push('You prefer a lighter device for extended use');
      recommendations.smaller.push('You value the cost savings of a smaller model');
    }
  } else if (deviceA.category === 'tv' || deviceB.category === 'tv') {
    // Larger TV recommendations
    if (larger.diagonal >= 75) {
      recommendations.larger.push('You have a large room with 10+ feet viewing distance');
      recommendations.larger.push('You want a cinematic, home theater experience');
      recommendations.larger.push('You primarily watch 4K/8K content');
    } else if (larger.diagonal >= 65) {
      recommendations.larger.push('You have a medium to large living room');
      recommendations.larger.push('You want an immersive viewing experience');
      recommendations.larger.push('You enjoy movies, sports, and gaming');
    } else {
      recommendations.larger.push('You want a bigger screen for better visibility');
      recommendations.larger.push('You have adequate wall or stand space');
      recommendations.larger.push('You prefer more immersive content viewing');
    }
    // Smaller TV recommendations
    if (smaller.diagonal < 50) {
      recommendations.smaller.push('You have a smaller room or bedroom setup');
      recommendations.smaller.push('Your viewing distance is under 7 feet');
      recommendations.smaller.push('You want a more budget-friendly option');
    } else if (smaller.diagonal < 65) {
      recommendations.smaller.push('You have a standard living room setup');
      recommendations.smaller.push('Your viewing distance is 7-10 feet');
      recommendations.smaller.push('You want good value without oversizing');
    } else {
      recommendations.smaller.push('You prefer a more modest screen size');
      recommendations.smaller.push('You want to save on cost and energy');
      recommendations.smaller.push('Your room layout works better with this size');
    }
  } else if (deviceA.category === 'monitor' || deviceB.category === 'monitor') {
    // Larger monitor recommendations
    if (larger.diagonal >= 32) {
      recommendations.larger.push('You need maximum screen real estate for multitasking');
      recommendations.larger.push('You work with video editing or complex spreadsheets');
      recommendations.larger.push('You have a deep desk with adequate viewing distance');
    } else if (larger.diagonal >= 27) {
      recommendations.larger.push('You need more screen space for productivity');
      recommendations.larger.push('You work with multiple windows simultaneously');
      recommendations.larger.push('You have adequate desk space');
    } else {
      recommendations.larger.push('You want more visible content area');
      recommendations.larger.push('You prefer larger text and UI elements');
      recommendations.larger.push('You value the extra workspace');
    }
    // Smaller monitor recommendations
    if (smaller.diagonal <= 24) {
      recommendations.smaller.push('You have limited desk space');
      recommendations.smaller.push('You sit closer to your monitor');
      recommendations.smaller.push('You prefer a more compact setup');
    } else if (smaller.diagonal <= 27) {
      recommendations.smaller.push('You want a balanced size for your desk');
      recommendations.smaller.push('You prefer less eye movement during use');
      recommendations.smaller.push('You value a cleaner, minimal setup');
    } else {
      recommendations.smaller.push('You want a more manageable screen size');
      recommendations.smaller.push('You prefer easier focus on content');
      recommendations.smaller.push('You want to reduce neck strain');
    }
  } else if (deviceA.category === 'tablet' || deviceB.category === 'tablet') {
    // Larger tablet recommendations
    if (larger.diagonal >= 12) {
      recommendations.larger.push('You use your tablet as a laptop replacement');
      recommendations.larger.push('You do professional creative work or note-taking');
      recommendations.larger.push('You want the best experience for split-screen multitasking');
    } else if (larger.diagonal >= 10) {
      recommendations.larger.push('You want a versatile tablet for work and entertainment');
      recommendations.larger.push('You prefer a larger canvas for drawing or writing');
      recommendations.larger.push('You enjoy watching movies and reading magazines');
    } else {
      recommendations.larger.push('You want more screen space for media consumption');
      recommendations.larger.push('You prefer easier reading and browsing');
      recommendations.larger.push('You value the extra display area');
    }
    // Smaller tablet recommendations
    if (smaller.diagonal < 8) {
      recommendations.smaller.push('You prioritize maximum portability');
      recommendations.smaller.push('You want a tablet that fits in a jacket pocket');
      recommendations.smaller.push('You prefer one-handed use for reading');
    } else if (smaller.diagonal < 10) {
      recommendations.smaller.push('You want a balance of portability and usability');
      recommendations.smaller.push('You prefer a lighter device for travel');
      recommendations.smaller.push('You value comfortable handheld use');
    } else {
      recommendations.smaller.push('You want a more portable option');
      recommendations.smaller.push('You prefer a lighter device for extended use');
      recommendations.smaller.push('You value easier handling and storage');
    }
  } else if (deviceA.category === 'projector' || deviceB.category === 'projector') {
    // Larger projector screen recommendations
    recommendations.larger.push('You have a dedicated home theater room');
    recommendations.larger.push('You want the most immersive cinematic experience');
    recommendations.larger.push('You have adequate throw distance for the projector');
    // Smaller projector screen recommendations
    recommendations.smaller.push('You have a multi-purpose room');
    recommendations.smaller.push('You want flexibility in projector placement');
    recommendations.smaller.push('You prefer a more manageable screen setup');
  }

  // Add general recommendations based on size difference if lists are still empty
  if (recommendations.larger.length === 0) {
    if (areaDiff > 30) {
      recommendations.larger.push('You want significantly more viewing area');
      recommendations.larger.push('You prioritize immersive content consumption');
      recommendations.larger.push('You have space to accommodate the larger size');
    } else {
      recommendations.larger.push('You prefer a larger display experience');
      recommendations.larger.push('You want more content visible at once');
      recommendations.larger.push('You value the extra screen real estate');
    }
  }

  if (recommendations.smaller.length === 0) {
    if (areaDiff > 30) {
      recommendations.smaller.push('You prefer a more compact form factor');
      recommendations.smaller.push('You value portability and space efficiency');
      recommendations.smaller.push('You want a more budget-friendly option');
    } else {
      recommendations.smaller.push('You prefer a slightly smaller size');
      recommendations.smaller.push('You want easier handling and placement');
      recommendations.smaller.push('You value the cost savings');
    }
  }

  return recommendations;
}

/**
 * Generate comparison-specific FAQ
 */
export function generateComparisonFAQ(
  deviceA: Device,
  deviceB: Device,
  areaA: number,
  areaB: number,
  dimsA: ComparisonDimensions,
  dimsB: ComparisonDimensions
) {
  const faqs: Array<{ question: string; answer: string }> = [];
  const larger = areaA > areaB ? deviceA : deviceB;
  const smaller = areaA > areaB ? deviceB : deviceA;
  const largerArea = Math.max(areaA, areaB);
  const smallerArea = Math.min(areaA, areaB);
  const sizeDiff = Math.abs(deviceA.diagonal - deviceB.diagonal);
  const areaDiff = ((largerArea - smallerArea) / smallerArea) * 100;

  // Size difference FAQ - optimized for real search patterns
  if (sizeDiff < 0.2) {
    // Nearly identical sizes - use "same size" question
    faqs.push({
      question: `Are ${deviceA.name} and ${deviceB.name} the same size?`,
      answer: `Yes, ${deviceA.name} and ${deviceB.name} are nearly identical in size. Both have ${deviceA.diagonal}" diagonal screens with the same ${largerArea.toFixed(1)} square inches of viewing area. The dimensional difference is negligible at just ${sizeDiff.toFixed(2)} inches.`
    });
  } else {
    // Different sizes - use "how much bigger" question (no "the" - matches search patterns)
    faqs.push({
      question: `How much bigger is ${larger.name} than ${smaller.name}?`,
      answer: `${larger.name} is ${sizeDiff.toFixed(1)} inches larger diagonally (${larger.diagonal}" vs ${smaller.diagonal}"), which translates to approximately ${areaDiff.toFixed(0)}% more screen area. In actual measurements, ${larger.name} provides ${largerArea.toFixed(1)} square inches of viewing space compared to ${smallerArea.toFixed(1)} square inches on ${smaller.name}.`
    });
  }

  // Category-specific FAQs
  if (deviceA.category === 'phone') {
    // One-handed use FAQ
    if (Math.abs(deviceA.diagonal - deviceB.diagonal) > 0.3) {
      faqs.push({
        question: `Which is better for one-handed use?`,
        answer: `The ${smaller.name} (${smaller.diagonal}") is significantly better for one-handed use. Phones under 6.3 inches can be comfortably operated with one hand, while larger phones like the ${larger.name} (${larger.diagonal}") typically require two hands for most tasks. If one-handed operation is important to you, the ${smaller.name} is the better choice.`
      });
    }

    // Pocket fit FAQ
    faqs.push({
      question: `Will both phones fit in my pocket?`,
      answer: `Both phones will fit in standard pockets, but the ${smaller.name} will be more comfortable. The ${larger.name} measures ${Math.max(dimsA.width, dimsB.width).toFixed(2)}" wide and ${Math.max(dimsA.height, dimsB.height).toFixed(2)}" tall, which may feel bulky in tight jeans or smaller pockets. The ${smaller.name} at ${Math.min(dimsA.width, dimsB.width).toFixed(2)}" × ${Math.min(dimsA.height, dimsB.height).toFixed(2)}" offers better portability.`
    });

    // Media consumption FAQ
    if (areaDiff > 10) {
      faqs.push({
        question: `Which is better for watching videos?`,
        answer: `The ${larger.name} provides a superior video watching experience with ${areaDiff.toFixed(0)}% more screen area. This extra space makes movies, YouTube videos, and streaming content more immersive. However, if you primarily watch videos in portrait mode or prefer a lighter device, the ${smaller.name} is still excellent for media consumption.`
      });
    }

    // Battery comparison FAQ (phone-specific)
    if (deviceA.phone?.battery && deviceB.phone?.battery) {
      const batteryA = deviceA.phone.battery;
      const batteryB = deviceB.phone.battery;
      const largerBattery = batteryA > batteryB ? deviceA : deviceB;
      const smallerBattery = batteryA > batteryB ? deviceB : deviceA;
      const batteryDiff = Math.abs(batteryA - batteryB);
      if (batteryDiff > 200) {
        faqs.push({
          question: `Which phone has better battery life?`,
          answer: `The ${largerBattery.name} has a larger ${Math.max(batteryA, batteryB)} mAh battery compared to ${Math.min(batteryA, batteryB)} mAh on the ${smallerBattery.name}, a difference of ${batteryDiff} mAh. This typically translates to ${Math.round(batteryDiff / 500)}-${Math.round(batteryDiff / 300)} hours more screen-on time, though actual battery life depends on usage patterns, display brightness, and software optimization.`
        });
      }
    }

    // Weight comparison FAQ (phone-specific)
    if (deviceA.phone?.weight && deviceB.phone?.weight) {
      const weightA = deviceA.phone.weight;
      const weightB = deviceB.phone.weight;
      const lighterPhone = weightA < weightB ? deviceA : deviceB;
      const heavierPhone = weightA < weightB ? deviceB : deviceA;
      const weightDiff = Math.abs(weightA - weightB);
      if (weightDiff > 10) {
        faqs.push({
          question: `Which phone is lighter and easier to hold?`,
          answer: `The ${lighterPhone.name} weighs ${Math.min(weightA, weightB)}g, which is ${weightDiff}g lighter than the ${heavierPhone.name} at ${Math.max(weightA, weightB)}g. For extended use, reading, or one-handed operation, the lighter ${lighterPhone.name} will cause less hand fatigue. However, the heavier ${heavierPhone.name} may feel more premium and substantial.`
        });
      }
    }

    // Refresh rate comparison FAQ (phone-specific)
    if (deviceA.phone?.refreshRate && deviceB.phone?.refreshRate) {
      const rateA = deviceA.phone.refreshRate;
      const rateB = deviceB.phone.refreshRate;
      if (rateA !== rateB) {
        const higherRate = rateA > rateB ? deviceA : deviceB;
        const lowerRate = rateA > rateB ? deviceB : deviceA;
        faqs.push({
          question: `Which phone has a smoother display for gaming?`,
          answer: `The ${higherRate.name} has a ${Math.max(rateA, rateB)}Hz display compared to ${Math.min(rateA, rateB)}Hz on the ${lowerRate.name}. The higher refresh rate provides smoother scrolling, more responsive touch input, and a better gaming experience. For competitive mobile gaming or users sensitive to motion smoothness, the ${higherRate.name} is the better choice.`
        });
      }
    }

    // Display brightness comparison FAQ (phone-specific)
    if (deviceA.phone?.peakBrightness && deviceB.phone?.peakBrightness) {
      const brightnessA = deviceA.phone.peakBrightness;
      const brightnessB = deviceB.phone.peakBrightness;
      const brightnessDiff = Math.abs(brightnessA - brightnessB);
      if (brightnessDiff > 200) {
        const brighterPhone = brightnessA > brightnessB ? deviceA : deviceB;
        const dimmerPhone = brightnessA > brightnessB ? deviceB : deviceA;
        faqs.push({
          question: `Which phone is better for outdoor use?`,
          answer: `The ${brighterPhone.name} has a peak brightness of ${Math.max(brightnessA, brightnessB)} nits compared to ${Math.min(brightnessA, brightnessB)} nits on the ${dimmerPhone.name}. The ${brightnessDiff} nits difference makes the ${brighterPhone.name} significantly easier to read in direct sunlight, making it the better choice for frequent outdoor use.`
        });
      }
    }
  } else if (deviceA.category === 'tv') {
    // Viewing distance FAQ
    const largerMinDist = (larger.diagonal * 1.2 / 12).toFixed(1);
    const largerMaxDist = (larger.diagonal * 2.5 / 12).toFixed(1);
    const smallerMinDist = (smaller.diagonal * 1.2 / 12).toFixed(1);
    const smallerMaxDist = (smaller.diagonal * 2.5 / 12).toFixed(1);

    faqs.push({
      question: `What viewing distance is recommended for each TV?`,
      answer: `For the ${larger.name} (${larger.diagonal}"), the optimal viewing distance is ${largerMinDist}-${largerMaxDist} feet based on THX and SMPTE standards. For the ${smaller.name} (${smaller.diagonal}"), sit ${smallerMinDist}-${smallerMaxDist} feet away. If your couch is closer than ${largerMinDist} feet, the ${smaller.name} would be more comfortable. If you sit farther than ${smallerMaxDist} feet, consider the ${larger.name} for better immersion.`
    });

    // Room size FAQ
    faqs.push({
      question: `Which TV size is right for my room?`,
      answer: `The ${smaller.name} (${smaller.diagonal}") is ideal for rooms up to 12×15 feet with viewing distances under ${smallerMaxDist} feet, perfect for bedrooms or smaller living rooms. The ${larger.name} (${larger.diagonal}") works best in rooms 15×20 feet or larger with viewing distances of ${largerMinDist}+ feet, ideal for open-concept spaces or dedicated home theaters.`
    });

    // 4K content FAQ
    if (larger.diagonal >= 55) {
      faqs.push({
        question: `Do I need 4K content for these TV sizes?`,
        answer: `For the ${larger.name} at ${larger.diagonal}", 4K content is highly recommended to maintain image quality at typical viewing distances. The ${smaller.name} at ${smaller.diagonal}" also benefits from 4K, but 1080p content is still acceptable if you sit farther away. Both TVs will upscale lower resolution content, but native 4K provides the best experience, especially for the larger screen.`
      });
    }
  } else if (deviceA.category === 'monitor') {
    // Desk space FAQ
    const largerWidth = Math.max(dimsA.width, dimsB.width);
    const smallerWidth = Math.min(dimsA.width, dimsB.width);

    faqs.push({
      question: `How much desk space do I need for each monitor?`,
      answer: `The ${larger.name} (${larger.diagonal}") requires approximately ${(largerWidth + 4).toFixed(0)}" of desk width including the stand, while the ${smaller.name} (${smaller.diagonal}") needs about ${(smallerWidth + 4).toFixed(0)}". For comfortable use, ensure you have at least ${(largerWidth * 1.5 / 12).toFixed(1)} feet of viewing distance for the ${larger.name} and ${(smallerWidth * 1.5 / 12).toFixed(1)} feet for the ${smaller.name}.`
    });

    // Productivity FAQ
    if (areaDiff > 15) {
      faqs.push({
        question: `Which is better for productivity and multitasking?`,
        answer: `The ${larger.name} (${larger.diagonal}") is significantly better for productivity with ${areaDiff.toFixed(0)}% more screen space. This allows you to comfortably view multiple windows side-by-side, making it ideal for coding, video editing, or working with spreadsheets. The ${smaller.name} is still capable but requires more window switching or smaller text sizes.`
      });
    }

    // Gaming FAQ
    faqs.push({
      question: `Which monitor is better for gaming?`,
      answer: `For competitive gaming, the ${smaller.name} (${smaller.diagonal}") may be preferable as it requires less eye movement to see the entire screen, giving you faster reaction times. For immersive single-player games, the ${larger.name} (${larger.diagonal}") provides a more cinematic experience. Both are excellent for gaming, but your preference depends on the types of games you play.`
    });
  } else if (deviceA.category === 'tablet') {
    // Portability FAQ
    faqs.push({
      question: `Which tablet is more portable?`,
      answer: `The ${smaller.name} (${smaller.diagonal}") is more portable and easier to hold for extended periods. It's ideal for reading, casual browsing, and travel. The ${larger.name} (${larger.diagonal}") offers ${areaDiff.toFixed(0)}% more screen space, making it better for productivity tasks, but it's heavier and less comfortable for one-handed use.`
    });

    // Reading FAQ
    if (sizeDiff > 2) {
      faqs.push({
        question: `Which is better for reading books and magazines?`,
        answer: `For books, the ${smaller.name} (${smaller.diagonal}") provides a more book-like experience and is easier to hold. For magazines, PDFs, and comics, the ${larger.name} (${larger.diagonal}") is superior as it can display full pages at readable sizes without zooming. Consider your primary reading material when choosing.`
      });
    }
  }

  // Price consideration FAQ (general)
  if (areaDiff > 20) {
    faqs.push({
      question: `Is the size difference worth the extra cost?`,
      answer: `The ${larger.name} typically costs 15-30% more than the ${smaller.name} due to the ${areaDiff.toFixed(0)}% increase in screen area. Whether it's worth it depends on your use case: if you spend several hours daily ${deviceA.category === 'phone' ? 'on your phone' : deviceA.category === 'tv' ? 'watching TV' : deviceA.category === 'monitor' ? 'at your desk' : 'using your tablet'}, the improved experience may justify the cost. For casual use, the ${smaller.name} offers excellent value.`
    });
  }

  return faqs.slice(0, 4); // Return max 4 FAQs to keep page focused
}

/**
 * Generate optimized SEO title (max ~60 chars for Google display)
 */
export function generateSEOTitle(deviceA: Device, deviceB: Device, areaA: number, areaB: number): string {
  const sizeDiff = Math.abs(deviceA.diagonal - deviceB.diagonal);

  // Format: "Device A vs Device B: Screen Size & Dimensions"
  // This targets both "screen size" and "dimensions" keywords
  const baseTitle = `${deviceA.name} vs ${deviceB.name}`;

  // Keep title concise but keyword-rich
  if (sizeDiff >= 0.5) {
    return `${baseTitle}: ${deviceA.diagonal}" vs ${deviceB.diagonal}" Size Comparison`;
  } else {
    return `${baseTitle}: Screen Size & Dimensions Compared`;
  }
}

/**
 * Generate optimized SEO description (max ~155 chars for Google display)
 */
export function generateSEODescription(
  deviceA: Device,
  deviceB: Device,
  areaA: number,
  areaB: number
): string {
  const larger = areaA > areaB ? deviceA : deviceB;
  const smaller = areaA > areaB ? deviceB : deviceA;
  const areaDiff = ((Math.max(areaA, areaB) - Math.min(areaA, areaB)) / Math.min(areaA, areaB)) * 100;

  // Start with key comparison info
  let description = `Compare ${deviceA.name} vs ${deviceB.name} screen size. `;

  // Add dimensions info (targets "dimensions" keyword)
  description += `${deviceA.diagonal}" vs ${deviceB.diagonal}" display dimensions. `;

  // Add category-specific value prop
  if (deviceA.category === 'phone') {
    description += `See which phone is bigger with visual size comparison & specs.`;
  } else if (deviceA.category === 'tv') {
    description += `Find the right TV size with viewing distance calculator.`;
  } else if (deviceA.category === 'monitor') {
    description += `Compare monitor dimensions for your desk setup.`;
  } else if (deviceA.category === 'tablet') {
    description += `Compare tablet sizes with visual overlay & specs.`;
  } else {
    description += `Visual comparison with exact dimensions & specs.`;
  }

  return description;
}
