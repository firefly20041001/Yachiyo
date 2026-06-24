import React, { useRef, useEffect, useState, useCallback } from 'react'

interface ColorWheelProps {
  color: string
  onChange: (color: string) => void
  size?: number
}

export function ColorWheel({ color, onChange, size = 200 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Draw color wheel
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 4

    // Draw hue wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180
      const endAngle = (angle + 1) * Math.PI / 180
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`
      ctx.fill()
    }

    // Draw saturation gradient (center = white)
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    // Draw current color indicator
    drawIndicator(ctx, cx, cy, radius)
  }, [color, size])

  const drawIndicator = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
    // Parse current color to get position
    const rgb = hexToRgb(color)
    if (!rgb) return

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const angle = hsl.h * Math.PI / 180
    const dist = hsl.s / 100 * radius

    const x = cx + Math.cos(angle) * dist
    const y = cy + Math.sin(angle) * dist

    // Draw indicator circle
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = color
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  const getColorAtPosition = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 4

    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > radius) return null

    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const hue = (angle + 360) % 360
    const saturation = Math.min(dist / radius * 100, 100)

    const rgb = hslToRgb(hue, saturation, 60)
    return rgbToHex(rgb.r, rgb.g, rgb.b)
  }, [size])

  const handleMouseDown = (e: React.MouseEvent) => {
    const color = getColorAtPosition(e.clientX, e.clientY)
    if (color) {
      onChange(color)
      setIsDragging(true)
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const color = getColorAtPosition(e.clientX, e.clientY)
    if (color) onChange(color)
  }, [isDragging, getColorAtPosition, onChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ cursor: 'crosshair', borderRadius: '50%' }}
      onMouseDown={handleMouseDown}
    />
  )
}

// Color conversion helpers
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}
