/**
 * Generate OG images for all devices
 * Run with: npx tsx scripts/generate-og-images.ts
 */

import satori from 'satori';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Import devices data
import { devices, calculateDimensions, calculateArea, calculateDevicePPI } from '../src/data/devices.js';

// Load fonts
const interBold = readFileSync(join(rootDir, 'src/assets/fonts/Inter-Bold.ttf'));
const interRegular = readFileSync(join(rootDir, 'src/assets/fonts/Inter-Regular.ttf'));

// Theme colors (teal/cyan)
const themeColor = '#14b8a6';  // primary-500
const themeBgColor = '#f0fdfa'; // primary-50

// Category labels (unified theme color)
const categoryConfig: Record<string, { label: string }> = {
  phone: { label: 'Smartphone' },
  tv: { label: 'Television' },
  monitor: { label: 'Monitor' },
  tablet: { label: 'Tablet' },
  projector: { label: 'Projector' },
};

// Format number helper
const fmt = (num: number, decimals = 1) => num.toFixed(decimals);

// Generate device visualization based on category
function createDeviceVisualization(category: string, diagonal: number, visualWidth: number, visualHeight: number) {
  const screenColor = themeBgColor;
  const frameColor = '#1f2937'; // dark gray for device frame
  const accentColor = themeColor;

  switch (category) {
    case 'phone':
      // Phone: rounded corners, notch/dynamic island, thin bezels
      return {
        type: 'div',
        props: {
          style: {
            width: `${visualWidth + 16}px`,
            height: `${visualHeight + 16}px`,
            backgroundColor: frameColor,
            borderRadius: '24px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          },
          children: [
            // Dynamic Island / Notch
            {
              type: 'div',
              props: {
                style: {
                  width: '60px',
                  height: '20px',
                  backgroundColor: frameColor,
                  borderRadius: '12px',
                  position: 'absolute',
                  top: '16px',
                },
              },
            },
            // Screen
            {
              type: 'div',
              props: {
                style: {
                  width: `${visualWidth}px`,
                  height: `${visualHeight}px`,
                  backgroundColor: screenColor,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: [{
                  type: 'div',
                  props: {
                    style: { fontSize: '36px', fontWeight: 700, color: accentColor },
                    children: `${diagonal}"`,
                  },
                }],
              },
            },
          ],
        },
      };

    case 'tablet':
      // Tablet: rounded corners, home button area or thin bezels
      return {
        type: 'div',
        props: {
          style: {
            width: `${visualWidth + 24}px`,
            height: `${visualHeight + 24}px`,
            backgroundColor: frameColor,
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  width: `${visualWidth}px`,
                  height: `${visualHeight}px`,
                  backgroundColor: screenColor,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: [{
                  type: 'div',
                  props: {
                    style: { fontSize: '40px', fontWeight: 700, color: accentColor },
                    children: `${diagonal}"`,
                  },
                }],
              },
            },
          ],
        },
      };

    case 'monitor':
      // Monitor: thin bezels, stand
      return {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
          children: [
            // Monitor body
            {
              type: 'div',
              props: {
                style: {
                  width: `${visualWidth + 12}px`,
                  height: `${visualHeight + 12}px`,
                  backgroundColor: frameColor,
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: [{
                  type: 'div',
                  props: {
                    style: {
                      width: `${visualWidth}px`,
                      height: `${visualHeight}px`,
                      backgroundColor: screenColor,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    children: [{
                      type: 'div',
                      props: {
                        style: { fontSize: '40px', fontWeight: 700, color: accentColor },
                        children: `${diagonal}"`,
                      },
                    }],
                  },
                }],
              },
            },
            // Stand neck
            {
              type: 'div',
              props: {
                style: {
                  width: '20px',
                  height: '30px',
                  backgroundColor: frameColor,
                },
              },
            },
            // Stand base
            {
              type: 'div',
              props: {
                style: {
                  width: '80px',
                  height: '12px',
                  backgroundColor: frameColor,
                  borderRadius: '4px',
                },
              },
            },
          ],
        },
      };

    case 'tv':
      // TV: very thin bezels, stand legs
      return {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
          children: [
            // TV body
            {
              type: 'div',
              props: {
                style: {
                  width: `${visualWidth + 8}px`,
                  height: `${visualHeight + 8}px`,
                  backgroundColor: frameColor,
                  borderRadius: '4px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: [{
                  type: 'div',
                  props: {
                    style: {
                      width: `${visualWidth}px`,
                      height: `${visualHeight}px`,
                      backgroundColor: screenColor,
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    children: [{
                      type: 'div',
                      props: {
                        style: { fontSize: '44px', fontWeight: 700, color: accentColor },
                        children: `${diagonal}"`,
                      },
                    }],
                  },
                }],
              },
            },
            // TV legs
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: `${visualWidth * 0.7}px`,
                  marginTop: '4px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        width: '24px',
                        height: '16px',
                        backgroundColor: frameColor,
                        borderRadius: '2px',
                      },
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        width: '24px',
                        height: '16px',
                        backgroundColor: frameColor,
                        borderRadius: '2px',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      };

    case 'projector':
      // Projector screen: frame with black border
      return {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
          children: [
            // Mounting bar
            {
              type: 'div',
              props: {
                style: {
                  width: `${visualWidth + 20}px`,
                  height: '8px',
                  backgroundColor: frameColor,
                  borderRadius: '2px',
                },
              },
            },
            // Screen with black border
            {
              type: 'div',
              props: {
                style: {
                  width: `${visualWidth + 20}px`,
                  height: `${visualHeight + 20}px`,
                  backgroundColor: '#000000',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: [{
                  type: 'div',
                  props: {
                    style: {
                      width: `${visualWidth}px`,
                      height: `${visualHeight}px`,
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    children: [{
                      type: 'div',
                      props: {
                        style: { fontSize: '40px', fontWeight: 700, color: accentColor },
                        children: `${diagonal}"`,
                      },
                    }],
                  },
                }],
              },
            },
          ],
        },
      };

    default:
      // Default fallback
      return {
        type: 'div',
        props: {
          style: {
            width: `${visualWidth}px`,
            height: `${visualHeight}px`,
            backgroundColor: screenColor,
            border: `4px solid ${accentColor}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          children: [{
            type: 'div',
            props: {
              style: { fontSize: '48px', fontWeight: 700, color: accentColor },
              children: `${diagonal}"`,
            },
          }],
        },
      };
  }
}

// Generate OG image for a device
async function generateOGImage(device: typeof devices[0]) {
  const dims = calculateDimensions(device.diagonal, device.ratio);
  const area = calculateArea(device.diagonal, device.ratio);
  const ppi = calculateDevicePPI(device);
  const config = categoryConfig[device.category] || categoryConfig.phone;

  // Calculate visual representation scale based on category
  let maxVisualWidth = 180;
  let maxVisualHeight = 260;
  let isPortrait = false; // Whether to display in portrait orientation

  // Adjust scale and orientation for different device types
  if (device.category === 'phone') {
    maxVisualWidth = 100;
    maxVisualHeight = 220;
    isPortrait = true; // Phone displayed vertically
  } else if (device.category === 'tablet') {
    maxVisualWidth = 140;
    maxVisualHeight = 200;
    isPortrait = true; // Tablet displayed vertically
  } else if (device.category === 'tv' || device.category === 'projector') {
    maxVisualWidth = 240;
    maxVisualHeight = 160;
  } else if (device.category === 'monitor') {
    maxVisualWidth = 220;
    maxVisualHeight = 160;
  }

  // For portrait devices, swap width/height for calculation
  const deviceWidth = isPortrait ? dims.height : dims.width;
  const deviceHeight = isPortrait ? dims.width : dims.height;

  const scale = Math.min(maxVisualWidth / deviceWidth, maxVisualHeight / deviceHeight);
  const visualWidth = Math.round(deviceWidth * scale);
  const visualHeight = Math.round(deviceHeight * scale);

  // Create device visualization
  const deviceVisualization = createDeviceVisualization(device.category, device.diagonal, visualWidth, visualHeight);

  // Create SVG using satori
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter',
        },
        children: [
          // Header bar
          {
            type: 'div',
            props: {
              style: {
                height: '8px',
                backgroundColor: themeColor,
                width: '100%',
              },
            },
          },
          // Main content
          {
            type: 'div',
            props: {
              style: {
                flex: 1,
                display: 'flex',
                padding: '48px 60px',
                gap: '60px',
              },
              children: [
                // Left side - Device visualization
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '320px',
                    },
                    children: [
                      // Device visualization
                      deviceVisualization,
                      // Category label
                      {
                        type: 'div',
                        props: {
                          style: {
                            marginTop: '20px',
                            padding: '8px 20px',
                            backgroundColor: themeColor,
                            color: '#ffffff',
                            borderRadius: '20px',
                            fontSize: '18px',
                            fontWeight: 600,
                          },
                          children: config.label,
                        },
                      },
                    ],
                  },
                },
                // Right side - Device info
                {
                  type: 'div',
                  props: {
                    style: {
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    },
                    children: [
                      // Device name
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: device.name.length > 25 ? '36px' : '44px',
                            fontWeight: 700,
                            color: '#111827',
                            lineHeight: 1.2,
                            marginBottom: '24px',
                          },
                          children: device.name,
                        },
                      },
                      // Specs grid
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                          },
                          children: [
                            // Screen size
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                },
                                children: [
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '20px',
                                        color: '#6B7280',
                                        width: '140px',
                                      },
                                      children: 'Screen Size',
                                    },
                                  },
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '24px',
                                        fontWeight: 600,
                                        color: '#111827',
                                      },
                                      children: `${device.diagonal}" diagonal`,
                                    },
                                  },
                                ],
                              },
                            },
                            // Dimensions
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                },
                                children: [
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '20px',
                                        color: '#6B7280',
                                        width: '140px',
                                      },
                                      children: 'Dimensions',
                                    },
                                  },
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '24px',
                                        fontWeight: 600,
                                        color: '#111827',
                                      },
                                      children: `${fmt(dims.width, 2)}" × ${fmt(dims.height, 2)}"`,
                                    },
                                  },
                                ],
                              },
                            },
                            // Area
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                },
                                children: [
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '20px',
                                        color: '#6B7280',
                                        width: '140px',
                                      },
                                      children: 'Screen Area',
                                    },
                                  },
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '24px',
                                        fontWeight: 600,
                                        color: '#111827',
                                      },
                                      children: `${fmt(area, 1)} sq in`,
                                    },
                                  },
                                ],
                              },
                            },
                            // Resolution (if available)
                            ...(device.resolution ? [{
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                },
                                children: [
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '20px',
                                        color: '#6B7280',
                                        width: '140px',
                                      },
                                      children: 'Resolution',
                                    },
                                  },
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '24px',
                                        fontWeight: 600,
                                        color: '#111827',
                                      },
                                      children: device.resolution,
                                    },
                                  },
                                ],
                              },
                            }] : []),
                            // PPI (if available)
                            ...(ppi ? [{
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                },
                                children: [
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '20px',
                                        color: '#6B7280',
                                        width: '140px',
                                      },
                                      children: 'Pixel Density',
                                    },
                                  },
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        fontSize: '24px',
                                        fontWeight: 600,
                                        color: '#111827',
                                      },
                                      children: `${Math.round(ppi)} PPI`,
                                    },
                                  },
                                ],
                              },
                            }] : []),
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          // Footer
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 60px',
                backgroundColor: '#F9FAFB',
                borderTop: '1px solid #E5E7EB',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '24px',
                      fontWeight: 700,
                      color: themeColor,
                    },
                    children: 'Screen Size Calculator',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '20px',
                      color: '#6B7280',
                    },
                    children: 'screensizecalculators.com',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interRegular,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );

  // Convert SVG to PNG using sharp
  const png = await sharp(Buffer.from(svg))
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer();

  return png;
}

// Main function
async function main() {
  const outputDir = join(rootDir, 'public/og');

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating OG images for ${devices.length} devices...`);

  let successCount = 0;
  let errorCount = 0;

  for (const device of devices) {
    try {
      const png = await generateOGImage(device);
      const outputPath = join(outputDir, `${device.id}.png`);
      writeFileSync(outputPath, png);
      successCount++;
      console.log(`✓ Generated: ${device.id}.png`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed: ${device.id}`, error);
    }
  }

  console.log(`\nDone! Generated ${successCount} images, ${errorCount} errors.`);

  // Calculate total size
  const { readdirSync, statSync } = await import('fs');
  const files = readdirSync(outputDir);
  const totalSize = files.reduce((acc, file) => {
    return acc + statSync(join(outputDir, file)).size;
  }, 0);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
