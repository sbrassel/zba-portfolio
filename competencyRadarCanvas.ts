import type { CompetencyCategory } from './types';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/** Zeichnet das Kompetenzradar (Kategorien-Ansicht) auf ein Canvas für PDF-Export. */
export function drawCompetencyRadarToCanvas(
  canvas: HTMLCanvasElement,
  categories: CompetencyCategory[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = canvas.width;
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.35;
  const innerRadius = size * 0.10;

  ctx.clearRect(0, 0, size, size);

  if (!categories.length) return;

  const categoryAngle = (2 * Math.PI) / categories.length;
  let currentAngle = -Math.PI / 2;

  categories.forEach((cat) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + categoryAngle;

    let totalLevel = 0;
    let count = 0;
    cat.competencies.forEach((comp) => {
      totalLevel += comp.level;
      count++;
    });
    const avgLevel = count > 0 ? totalLevel / count : 0;

    const minRadius = innerRadius;
    const maxRadius = outerRadius;
    const radiusRange = maxRadius - minRadius;
    const segmentRadius = minRadius + radiusRange * (avgLevel / 4);

    ctx.beginPath();
    ctx.arc(centerX, centerY, segmentRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();

    if (avgLevel > 0) {
      const rgb = hexToRgb(cat.color);
      if (rgb) {
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 + (avgLevel / 4) * 0.65})`;
      } else {
        ctx.fillStyle = cat.color;
      }
      ctx.fill();
      ctx.strokeStyle = cat.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
    }
    currentAngle += categoryAngle;
  });

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  const radiusRange = outerRadius - innerRadius;
  for (let i = 1; i <= 4; i++) {
    const radius = innerRadius + radiusRange * (i / 4);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  currentAngle = -Math.PI / 2;
  for (let i = 0; i < categories.length; i++) {
    ctx.beginPath();
    ctx.moveTo(
      centerX + Math.cos(currentAngle) * innerRadius,
      centerY + Math.sin(currentAngle) * innerRadius
    );
    ctx.lineTo(
      centerX + Math.cos(currentAngle) * outerRadius,
      centerY + Math.sin(currentAngle) * outerRadius
    );
    ctx.stroke();
    currentAngle += categoryAngle;
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  currentAngle = -Math.PI / 2 + categoryAngle / 2;
  categories.forEach((cat) => {
    const labelRadius = outerRadius + 18;
    const x = centerX + Math.cos(currentAngle) * labelRadius;
    const y = centerY + Math.sin(currentAngle) * labelRadius;
    ctx.fillText(cat.name, x, y);
    currentAngle += categoryAngle;
  });
}
