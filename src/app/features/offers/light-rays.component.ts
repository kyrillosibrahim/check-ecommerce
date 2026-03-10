import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';

declare const window: any;

const hexToRgb = (hex: string): number[] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

type RaysOrigin = 'top-center' | 'top-left' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

const getAnchorAndDir = (origin: RaysOrigin, w: number, h: number) => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left':
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case 'top-right':
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case 'left':
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right':
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left':
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-center':
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right':
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default: // top-center
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

@Component({
  selector: 'app-light-rays',
  standalone: true,
  template: `<div #container class="light-rays-container"></div>`,
  styles: [`
    :host { display: block; position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .light-rays-container { width: 100%; height: 100%; overflow: hidden; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightRaysComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  @Input() raysOrigin: RaysOrigin = 'top-center';
  @Input() raysColor = '#ffffff';
  @Input() raysSpeed = 1;
  @Input() lightSpread = 1;
  @Input() rayLength = 2;
  @Input() pulsating = false;
  @Input() fadeDistance = 1.0;
  @Input() saturation = 1.0;
  @Input() followMouse = true;
  @Input() mouseInfluence = 0.1;
  @Input() noiseAmount = 0.0;
  @Input() distortion = 0.0;

  private renderer: any;
  private uniforms: any;
  private animationId: number | null = null;
  private observer: IntersectionObserver | null = null;
  private isVisible = false;
  private resizeHandler: (() => void) | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouse = { x: 0.5, y: 0.5 };
  private smoothMouse = { x: 0.5, y: 0.5 };

  private vertexShader = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  private fragmentShader = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;

  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);

  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);

  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  vec4 fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
  gl_FragColor = fragColor;
}`;

  async ngAfterViewInit(): Promise<void> {
    // Only init WebGL when component is visible in viewport
    this.observer = new IntersectionObserver(
      entries => {
        const visible = entries[0].isIntersecting;
        if (visible && !this.isVisible) {
          this.isVisible = true;
          this.startWebGL();
        } else if (!visible && this.isVisible) {
          this.isVisible = false;
          this.stopAnimation();
        }
      },
      { threshold: 0.1 }
    );
    this.observer.observe(this.containerRef.nativeElement);
  }

  private async startWebGL(): Promise<void> {
    if (this.renderer) {
      // Already initialized, just resume animation
      this.animationId = requestAnimationFrame(this.loop);
      return;
    }

    try {
      const OGL = await import('ogl');
      this.initWebGL(OGL);
    } catch (e) {
      console.warn('OGL not available:', e);
    }
  }

  private initWebGL(OGL: any): void {
    const container = this.containerRef.nativeElement;
    const renderer = new OGL.Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    this.renderer = renderer;
    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    container.appendChild(gl.canvas);

    const uniforms: any = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      rayPos: { value: [0, 0] },
      rayDir: { value: [0, 1] },
      raysColor: { value: hexToRgb(this.raysColor) },
      raysSpeed: { value: this.raysSpeed },
      lightSpread: { value: this.lightSpread },
      rayLength: { value: this.rayLength },
      pulsating: { value: this.pulsating ? 1.0 : 0.0 },
      fadeDistance: { value: this.fadeDistance },
      saturation: { value: this.saturation },
      mousePos: { value: [0.5, 0.5] },
      mouseInfluence: { value: this.mouseInfluence },
      noiseAmount: { value: this.noiseAmount },
      distortion: { value: this.distortion },
    };
    this.uniforms = uniforms;

    const geometry = new OGL.Triangle(gl);
    const program = new OGL.Program(gl, {
      vertex: this.vertexShader,
      fragment: this.fragmentShader,
      uniforms
    });
    const mesh = new OGL.Mesh(gl, { geometry, program });

    const updateSize = () => {
      const { clientWidth: wCSS, clientHeight: hCSS } = container;
      renderer.setSize(wCSS, hCSS);
      renderer.dpr = Math.min(window.devicePixelRatio, 2);
      const dpr = renderer.dpr;
      const w = wCSS * dpr;
      const h = hCSS * dpr;

      uniforms.iResolution.value = [w, h];
      const { anchor, dir } = getAnchorAndDir(this.raysOrigin, w, h);
      uniforms.rayPos.value = anchor;
      uniforms.rayDir.value = dir;
    };

    this.resizeHandler = updateSize;
    window.addEventListener('resize', updateSize);

    // Mouse tracking
    if (this.followMouse) {
      this.mouseMoveHandler = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) / rect.width;
        this.mouse.y = (e.clientY - rect.top) / rect.height;
      };
      window.addEventListener('mousemove', this.mouseMoveHandler);
    }

    // Render loop stored as arrow fn for resume
    this.loop = (t: number) => {
      if (!this.renderer || !this.uniforms) return;

      uniforms.iTime.value = t * 0.001;

      // Smooth mouse interpolation
      if (this.followMouse && this.mouseInfluence > 0) {
        const smoothing = 0.92;
        this.smoothMouse.x = this.smoothMouse.x * smoothing + this.mouse.x * (1 - smoothing);
        this.smoothMouse.y = this.smoothMouse.y * smoothing + this.mouse.y * (1 - smoothing);
        uniforms.mousePos.value = [this.smoothMouse.x, this.smoothMouse.y];
      }

      try {
        renderer.render({ scene: mesh });
      } catch { return; }
      this.animationId = requestAnimationFrame(this.loop);
    };

    updateSize();
    this.animationId = requestAnimationFrame(this.loop);
  }

  private loop = (_t: number) => {};

  private stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
    }

    if (this.renderer) {
      try {
        const ext = this.renderer.gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
        const canvas = this.renderer.gl.canvas;
        if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
      } catch {}
    }
  }
}
