import { useEffect, useRef } from 'react';

interface ChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  type: 'bar' | 'line' | 'pie';
  height?: number;
  showValues?: boolean;
  title?: string;
}

export default function UzumChart({ data, type, height = 300, showValues = true, title }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Padding
    const padding = { top: 40, right: 20, bottom: 60, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value), 1);

    // Colors
    const defaultColors = [
      '#1E6FDB', '#4CAF50', '#FF9F1C', '#1E6FDB', '#ef4444',
      '#3FA9F5', '#4CAF50', '#f97316', '#06b6d4', '#ec4899'
    ];

    if (type === 'bar') {
      drawBarChart(ctx, data, chartWidth, chartHeight, padding, maxValue, defaultColors, showValues);
    } else if (type === 'line') {
      drawLineChart(ctx, data, chartWidth, chartHeight, padding, maxValue, defaultColors);
    } else if (type === 'pie') {
      drawPieChart(ctx, data, rect.width, rect.height, defaultColors, showValues);
    }
  }, [data, type, showValues]);

  function drawBarChart(
    ctx: CanvasRenderingContext2D,
    data: any[],
    width: number,
    height: number,
    padding: any,
    maxValue: number,
    colors: string[],
    showValues: boolean
  ) {
    const barWidth = width / data.length - 10;
    const barSpacing = 10;

    // Draw Y axis labels
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * i;
      const y = padding.top + height - (height / 5) * i;
      ctx.fillText(formatNumber(value), padding.left - 10, y + 5);
      
      // Draw grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
    }

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * height;
      const x = padding.left + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = padding.top + height - barHeight;

      // Bar
      ctx.fillStyle = item.color || colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Value on top
      if (showValues) {
        ctx.fillStyle = '#111';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(formatNumber(item.value), x + barWidth / 2, y - 5);
      }

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barWidth / 2, padding.top + height + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(truncateText(item.label, 15), 0, 0);
      ctx.restore();
    });
  }

  function drawLineChart(
    ctx: CanvasRenderingContext2D,
    data: any[],
    width: number,
    height: number,
    padding: any,
    maxValue: number,
    colors: string[]
  ) {
    const pointSpacing = width / (data.length - 1 || 1);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
    }

    // Draw Y axis labels
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (maxValue / 5) * i;
      const y = padding.top + (height / 5) * i;
      ctx.fillText(formatNumber(value), padding.left - 10, y + 5);
    }

    // Draw line
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    data.forEach((item, index) => {
      const x = padding.left + index * pointSpacing;
      const y = padding.top + height - (item.value / maxValue) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    data.forEach((item, index) => {
      const x = padding.left + index * pointSpacing;
      const y = padding.top + height - (item.value / maxValue) * height;

      // Point circle
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // White border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(truncateText(item.label, 10), x, padding.top + height + 20);
    });
  }

  function drawPieChart(
    ctx: CanvasRenderingContext2D,
    data: any[],
    width: number,
    height: number,
    colors: string[],
    showValues: boolean
  ) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;

    // Draw slices
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      
      // Slice
      ctx.fillStyle = item.color || colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // White border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      if (showValues && item.value > 0) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        const percentage = ((item.value / total) * 100).toFixed(1);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }

      currentAngle += sliceAngle;
    });

    // Legend
    const legendX = 20;
    let legendY = height - data.length * 25;

    data.forEach((item, index) => {
      // Color box
      ctx.fillStyle = item.color || colors[index % colors.length];
      ctx.fillRect(legendX, legendY, 15, 15);

      // Text
      ctx.fillStyle = '#374151';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const text = `${truncateText(item.label, 20)}: ${formatNumber(item.value)}`;
      ctx.fillText(text, legendX + 20, legendY + 7);

      legendY += 25;
    });
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toString();
  }

  function truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {title && (
        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#111',
          marginBottom: '20px',
          marginTop: 0,
        }}>
          {title}
        </h3>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          display: 'block',
        }}
      />
    </div>
  );
}
