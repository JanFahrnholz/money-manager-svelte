import { Component, effect, ElementRef, input, viewChild } from '@angular/core';

export interface BalancePoint {
  date: string;
  balance: number;
}

const PAD_LEFT = 40;
const PAD_RIGHT = 30;
const PAD_TOP = 10;
const PAD_BOTTOM = 28;
const VIEW_W = 320;
const VIEW_H = 130;
const CHART_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

@Component({
  selector: 'app-balance-graph',
  standalone: true,
  template: `
    <div style="background: var(--ion-card-background, #222); border-radius: 12px; padding: 12px 8px 4px;">
      <svg
        #svgEl
        [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH"
        style="width: 100%; height: auto; display: block;"
        preserveAspectRatio="xMidYMid meet"
      ></svg>
    </div>
  `,
})
export class BalanceGraphComponent {
  readonly data = input.required<BalancePoint[]>();

  readonly svgEl = viewChild.required<ElementRef<SVGElement>>('svgEl');

  readonly viewW = VIEW_W;
  readonly viewH = VIEW_H;

  constructor() {
    effect(() => {
      const points = this.data();
      const svg = this.svgEl().nativeElement;
      this.render(svg, points);
    });
  }

  private render(svg: SVGElement, points: BalancePoint[]): void {
    if (points.length < 2) {
      svg.innerHTML = `<text x="${VIEW_W / 2}" y="${VIEW_H / 2}" text-anchor="middle" fill="#999" font-size="14">Keine Daten</text>`;
      return;
    }

    const balances = points.map((p) => p.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const range = max - min || 1;

    const color = balances[balances.length - 1] >= 0 ? '#4cd964' : '#ff3b30';

    const times = points.map((p) => new Date(p.date).getTime());
    const minTime = times[0];
    const maxTime = times[times.length - 1];
    const timeRange = maxTime - minTime || 1;
    const toX = (i: number) => PAD_LEFT + ((times[i] - minTime) / timeRange) * CHART_W;
    const toY = (v: number) => PAD_TOP + CHART_H - ((v - min) / range) * CHART_H;

    const mid = min + range / 2;
    const fmt = (v: number) => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0));

    // Grid lines
    let html = '';
    const gridYs = [PAD_TOP, PAD_TOP + CHART_H / 2, PAD_TOP + CHART_H];
    for (const gy of gridYs) {
      html += `<line x1="${PAD_LEFT}" y1="${gy}" x2="${PAD_LEFT + CHART_W}" y2="${gy}" stroke="#444" stroke-width="0.5"/>`;
    }

    // Y-axis labels
    html += `<text x="${PAD_LEFT - 4}" y="${PAD_TOP + 4}" text-anchor="end" fill="#999" font-size="8">${fmt(max)}\u20AC</text>`;
    html += `<text x="${PAD_LEFT - 4}" y="${PAD_TOP + CHART_H / 2 + 3}" text-anchor="end" fill="#999" font-size="8">${fmt(mid)}\u20AC</text>`;
    html += `<text x="${PAD_LEFT - 4}" y="${PAD_TOP + CHART_H + 3}" text-anchor="end" fill="#999" font-size="8">${fmt(min)}\u20AC</text>`;

    // Zero line (always visible when range crosses 0)
    if (min <= 0 && max >= 0) {
      const zeroY = toY(0);
      html += `<line x1="${PAD_LEFT}" y1="${zeroY}" x2="${PAD_LEFT + CHART_W}" y2="${zeroY}" stroke="#ffd600" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>`;
      html += `<text x="${PAD_LEFT - 4}" y="${zeroY + 3}" text-anchor="end" fill="#ffd600" font-size="8" opacity="0.8">0\u20AC</text>`;
    }

    // Gradient definition
    const gradId = 'balGrad';
    html += `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">`;
    html += `<stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>`;
    html += `<stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>`;
    html += `</linearGradient></defs>`;

    // Area fill path
    const polyPoints = points.map((p, i) => `${toX(i)},${toY(p.balance)}`);
    const areaPath = `M${toX(0)},${PAD_TOP + CHART_H} L${polyPoints.join(' L')} L${toX(points.length - 1)},${PAD_TOP + CHART_H} Z`;
    html += `<path d="${areaPath}" fill="url(#${gradId})"/>`;

    // Polyline
    html += `<polyline points="${polyPoints.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>`;

    // Dots (only render subset to avoid SVG clutter with many points)
    const step = Math.max(1, Math.floor(points.length / 40));
    for (let i = 0; i < points.length; i += step) {
      html += `<circle cx="${toX(i)}" cy="${toY(points[i].balance)}" r="2" fill="${color}"/>`;
    }
    // Always render last dot
    html += `<circle cx="${toX(points.length - 1)}" cy="${toY(points[points.length - 1].balance)}" r="3" fill="${color}" stroke="#1a1a1a" stroke-width="1.5"/>`;

    // X-axis date labels (show ~4-5 evenly spaced dates)
    const labelCount = Math.min(5, points.length);
    const labelStep = Math.max(1, Math.floor((points.length - 1) / (labelCount - 1)));
    for (let i = 0; i < points.length; i += labelStep) {
      const d = new Date(points[i].date);
      const label = d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      html += `<text x="${toX(i)}" y="${VIEW_H - 2}" text-anchor="middle" fill="#666" font-size="7">${label}</text>`;
    }
    // Always show last date (only if far enough from previous label)
    if (points.length > 1) {
      const lastIdx = points.length - 1;
      const prevLabelIdx = Math.floor((labelCount - 1) * labelStep);
      if (lastIdx - prevLabelIdx > points.length * 0.1) {
        const lastD = new Date(points[lastIdx].date);
        const lastLabel = lastD.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
        html += `<text x="${toX(lastIdx)}" y="${VIEW_H - 2}" text-anchor="end" fill="#666" font-size="7">${lastLabel}</text>`;
      }
    }

    svg.innerHTML = html;
  }
}
