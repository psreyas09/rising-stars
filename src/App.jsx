import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, ZoomIn, Move, RefreshCw, Sparkles, Check, AlertCircle } from 'lucide-react';
import flyerConfig from './flyerConfig.json';

export default function App() {
  // Input fields state
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [optional, setOptional] = useState('');
  
  // Image editing state
  const [imageSrc, setImageSrc] = useState('');
  const [userImage, setUserImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffsetStart, setDragOffsetStart] = useState({ x: 0, y: 0 });
  const [dragActive, setDragActive] = useState(false);
  
  // Canvas rendering states
  const [fontLoaded, setFontLoaded] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const canvasRef = useRef(null);
  const templateImgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Template details from configuration file
  const { size: canvasSize, src: templateSrc } = flyerConfig.template;
  const { center: pfpCenter, radius: pfpRadius } = flyerConfig.pfp;
 
  // Load template image and process transparency in the circle area
  useEffect(() => {
    const img = new Image();
    img.src = templateSrc;
    img.onload = () => {
      // If template is already transparent, we can skip pixel processing
      if (flyerConfig.pfp.maskMode === 'transparent') {
        templateImgRef.current = img;
        setTemplateLoaded(true);
        return;
      }

      // Create an offscreen canvas to process the template pixels
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = canvasSize;
      offscreenCanvas.height = canvasSize;
      const ctx = offscreenCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
 
      // Read image data to mask out the light-blue placeholder circle
      try {
        const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize);
        const data = imgData.data;
 
        // Loop through the circle bounding box with a small safety margin
        const startX = Math.floor(pfpCenter.x - pfpRadius - 10);
        const endX = Math.ceil(pfpCenter.x + pfpRadius + 10);
        const startY = Math.floor(pfpCenter.y - pfpRadius - 10);
        const endY = Math.ceil(pfpCenter.y + pfpRadius + 10);
 
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) continue;
 
            const dx = x - pfpCenter.x;
            const dy = y - pfpCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
 
            // If the pixel is strictly inside the circle placeholder radius
            if (dist < pfpRadius) {
              const idx = (y * canvasSize + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
 
              if (flyerConfig.pfp.maskMode === 'detect-purple-tag') {
                // We want to preserve ONLY the purple tag overlay and make the rest of the circle transparent.
                // In the purple tag, Blue is dominant (b > g * 2 && b > 50 && r < 100).
                const isPurpleTag = (b > g * 2 && b > 50 && r < 100);
                if (!isPurpleTag) {
                  data[idx + 3] = 0; // Make pixel completely transparent
                }
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        templateImgRef.current = offscreenCanvas;
      } catch (err) {
        console.error("Error processing template image transparency, using raw template:", err);
        templateImgRef.current = img;
      }
      setTemplateLoaded(true);
    };
    img.onerror = () => {
      console.error(`Failed to load template image (${templateSrc})`);
    };
  }, []);
 
  // Load custom font dynamically
  useEffect(() => {
    const loadFont = async () => {
      try {
        const font = new FontFace(flyerConfig.text.fontName, 'url(./Outfit-Variable.ttf)');
        await font.load();
        document.fonts.add(font);
        setFontLoaded(true);
      } catch (err) {
        console.error(`Failed to load custom ${flyerConfig.text.fontName} font, falling back to system fonts:`, err);
        setFontLoaded(true);
      }
    };
    loadFont();
  }, []);

  // Handle loading of the user's uploaded image into an HTMLImageElement
  useEffect(() => {
    if (!imageSrc) {
      setUserImage(null);
      return;
    }

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setUserImage(img);
    };
    img.onerror = (err) => {
      console.error("Error loading user image:", err);
      setUserImage(null);
    };
  }, [imageSrc]);

  // Draw composite image on canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 2. Draw User Profile Photo FIRST (Layered Underneath Template)
    if (userImage) {
      ctx.save();
      
      // Create circular clip path (slightly padded to prevent sub-pixel white gaps under the template border)
      ctx.beginPath();
      ctx.arc(pfpCenter.x, pfpCenter.y, pfpRadius + 3, 0, Math.PI * 2);
      ctx.clip();

      // Calculate sizes to cover the frame (diameter = pfpRadius * 2)
      const frameDiameter = pfpRadius * 2;
      const baseScale = frameDiameter / Math.min(userImage.width, userImage.height);
      const drawWidth = userImage.width * baseScale * scale;
      const drawHeight = userImage.height * baseScale * scale;

      // Center image and apply manual translation offsets
      const drawX = pfpCenter.x - drawWidth / 2 + offset.x;
      const drawY = pfpCenter.y - drawHeight / 2 + offset.y;

      ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    } else {
      // Draw standard placeholder avatar underneath template
      ctx.save();
      ctx.beginPath();
      ctx.arc(pfpCenter.x, pfpCenter.y, pfpRadius, 0, Math.PI * 2);
      ctx.clip();

      // Placeholder background
      ctx.fillStyle = '#120d24';
      ctx.fillRect(pfpCenter.x - pfpRadius, pfpCenter.y - pfpRadius, pfpRadius * 2, pfpRadius * 2);

      // Draw avatar shape
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(pfpCenter.x, pfpCenter.y - 50, 150, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(pfpCenter.x, pfpCenter.y + 350, 300, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3. Draw Background Template ON TOP of the Profile Photo
    // This allows the template's native white circular border, green waves, and purple tag
    // to naturally overlap the photo frame as intended.
    if (templateLoaded && templateImgRef.current) {
      ctx.drawImage(templateImgRef.current, 0, 0, canvasSize, canvasSize);
    } else if (!templateLoaded) {
      // Fallback colored background while template loads
      ctx.fillStyle = '#0f0c1b';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    // 4. Draw Custom Text Fields on Purple Tag (configured via flyerConfig.json)
    const fontName = fontLoaded ? flyerConfig.text.fontName : 'system-ui, sans-serif';
    ctx.textAlign = flyerConfig.text.align || 'left';
    ctx.textBaseline = flyerConfig.text.baseline || 'top';
    ctx.fillStyle = flyerConfig.text.color || '#ffffff';

    const textLeft = flyerConfig.text.left;

    flyerConfig.text.fields.forEach(field => {
      let fieldValue = '';
      if (field.id === 'name') fieldValue = name;
      else if (field.id === 'position') fieldValue = position;
      else if (field.id === 'optional') fieldValue = optional;

      if (fieldValue.trim()) {
        ctx.font = `${field.style ? field.style + ' ' : ''}${field.size}px ${fontName}`;
        ctx.fillText(fieldValue.trim(), textLeft, field.y);
      }
    });
  };

  // Re-draw canvas whenever variables change
  useEffect(() => {
    drawCanvas();
  }, [name, position, optional, userImage, scale, offset, fontLoaded, templateLoaded]);

  // Handle image upload
  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      // Reset scale and offset on new image upload
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Direct canvas drag-to-pan handlers
  const handleCanvasMouseDown = (e) => {
    if (!userImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get click coordinates relative to canvas bounding rect
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert click coordinates to 3000x3000px space
    const canvasX = (x / rect.width) * canvasSize;
    const canvasY = (y / rect.height) * canvasSize;

    // Check if the click is within the profile picture circular frame
    const distance = Math.sqrt(Math.pow(canvasX - pfpCenter.x, 2) + Math.pow(canvasY - pfpCenter.y, 2));
    if (distance <= pfpRadius) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffsetStart({ ...offset });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;

    // Calculate mouse displacement delta
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scale delta back to high-res 3000x3000px space
    const rect = canvas.getBoundingClientRect();
    const scaledDeltaX = (deltaX / rect.width) * canvasSize;
    const scaledDeltaY = (deltaY / rect.height) * canvasSize;

    setOffset({
      x: dragOffsetStart.x + scaledDeltaX,
      y: dragOffsetStart.y + scaledDeltaY
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Reset editor settings
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Download high-resolution flyer
  const handleDownload = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    // Tiny timeout to show spinner state and ensure final render is captured
    setTimeout(() => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Force final draw to guarantee high-res quality
        drawCanvas();

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        
        // Custom name format
        const formattedName = name.trim().toLowerCase().replace(/\s+/g, '_') || 'flyer';
        link.download = `rising_stars_flyer_${formattedName}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Error generating high-resolution flyer download:", err);
      } finally {
        setIsDownloading(false);
      }
    }, 500);
  };

  return (
    <div className="app-container">
      {/* Premium Header */}
      <header className="app-header">
        <div className="logo-section">
          <img 
            src="./Official_Globe_White.png" 
            alt="IEEE Rising Stars Logo" 
            style={{ height: '42px', width: 'auto', display: 'block', objectFit: 'contain' }} 
          />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em' }}>RISING STARS</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Event Flyer Customizer</p>
          </div>
        </div>
      </header>

      {/* Main Workspace Dashboard */}
      <main className="main-grid">
        
        {/* Left Side: Control Panel (Form Inputs & Photo Adjustments) */}
        <section className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }} className="title-gradient">Create Your Flyer</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fill in your details and upload a photo to customize your badge.</p>
          </div>

          {/* 1. Name & Position & Company Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="text-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={40}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Position / Title</label>
              <input 
                type="text" 
                className="text-input" 
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Software Engineer, Designer, etc."
                maxLength={50}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Company / Institution (Optional)</label>
              <input 
                type="text" 
                className="text-input" 
                value={optional}
                onChange={(e) => setOptional(e.target.value)}
                placeholder="Google, MIT, etc. (leave blank to hide)"
                maxLength={50}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

          {/* 2. Photo Uploader Dropzone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="input-label">Profile Photo</label>
            
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
            />

            {!imageSrc ? (
              <div 
                className={`dropzone ${dragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <Upload className="dropzone-icon" />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Upload profile picture</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Drag & drop or click to browse</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple-light)', padding: '6px', borderRadius: '8px' }}>
                      <Check size={16} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Photo Uploaded</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Adjust scale & crop offsets below</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current.click()} 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Change
                  </button>
                </div>

                {/* Scaling slider */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span>Photo Scale</span>
                    <span>{Math.round(scale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.05" 
                    value={scale} 
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="custom-slider"
                  />
                </div>

                {/* Horizontal Position slider */}
                <div className="slider-container" style={{ marginTop: '10px' }}>
                  <div className="slider-header">
                    <span>Horizontal Position (X)</span>
                    <span>{Math.round(offset.x)}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="-1000" 
                    max="1000" 
                    step="5" 
                    value={Math.round(offset.x)} 
                    onChange={(e) => setOffset(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                    className="custom-slider"
                  />
                </div>

                {/* Vertical Position slider */}
                <div className="slider-container" style={{ marginTop: '10px' }}>
                  <div className="slider-header">
                    <span>Vertical Position (Y)</span>
                    <span>{Math.round(offset.y)}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="-1000" 
                    max="1000" 
                    step="5" 
                    value={Math.round(offset.y)} 
                    onChange={(e) => setOffset(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                    className="custom-slider"
                  />
                </div>

                {/* Reset button */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button onClick={handleReset} className="btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem', width: '100%', borderRadius: 'var(--radius-md)' }}>
                    <RefreshCw size={14} style={{ marginRight: '6px' }} />
                    Reset Image Alignment
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

          {/* 3. Action Buttons */}
          <button 
            className="btn-primary" 
            onClick={handleDownload}
            disabled={isDownloading || !templateLoaded}
            style={{ width: '100%' }}
          >
            {isDownloading ? (
              <>
                <RefreshCw className="spinner" size={18} />
                Generating High-Res Flyer...
              </>
            ) : (
              <>
                <Download size={18} />
                Download Custom Flyer
              </>
            )}
          </button>
        </section>

        {/* Right Side: Canvas Real-time Interactive Preview */}
        <section className="preview-container">
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxW: '600px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Flyer Preview</h3>
              {userImage && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Move size={12} />
                  Drag photo directly in the circle to position
                </span>
              )}
            </div>
            
            {/* Main high-resolution canvas, styled responsive */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', background: '#090610', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={(e) => {
                  if (e.touches && e.touches[0]) {
                    const touch = e.touches[0];
                    handleCanvasMouseDown({
                      clientX: touch.clientX,
                      clientY: touch.clientY
                    });
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches && e.touches[0]) {
                    const touch = e.touches[0];
                    handleCanvasMouseMove({
                      clientX: touch.clientX,
                      clientY: touch.clientY
                    });
                  }
                }}
                onTouchEnd={handleCanvasMouseUp}
                style={{
                  width: '100%',
                  height: '100%',
                  cursor: userImage ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  display: 'block'
                }}
              />
              
              {!templateLoaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', background: 'rgba(11, 8, 19, 0.9)', gap: '15px' }}>
                  <RefreshCw className="spinner" size={32} style={{ color: 'var(--accent-purple-light)' }} />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading flyer template...</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(126, 34, 206, 0.08)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(126, 34, 206, 0.15)' }}>
              <AlertCircle size={16} style={{ color: 'var(--accent-purple-light)', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Your photo and details are processed entirely in your web browser. No data is sent to a server. High-resolution exports are rendered at 3000x3000px for print and social media sharing.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
