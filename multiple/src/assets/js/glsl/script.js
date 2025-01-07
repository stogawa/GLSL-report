import { WebGLUtility, ShaderProgram } from '../lib/webgl.js';
import { WebGLMath } from '../lib/math.js';
import { WebGLOrbitCamera } from '../lib/camera.js';

// 画像ファイルをインポート
import sampleImage from '/assets/img/sample.jpg';  // Webpackによるパス解決
import sampleImage2 from '/assets/img/sample2.jpg'; // もう1枚の画像もインポート

window.addEventListener('DOMContentLoaded', async () => {
  // 1つ目のWebGLAppインスタンス（webgl-canvas01用）
  const app1 = new WebGLApp();
  window.addEventListener('resize', app1.resize, false);
  app1.init('webgl-canvas01');
  await app1.load(sampleImage); // 初期化時にインポートした画像パスを渡す
  app1.setup();
  app1.render();

  // 2つ目のWebGLAppインスタンス（webgl-canvas02用）
  const app2 = new WebGLApp();
  window.addEventListener('resize', app2.resize, false);
  app2.init('webgl-canvas02');
  await app2.load(sampleImage2); // 別の画像を指定
  app2.setup();
  app2.render();
}, false);

class WebGLApp {
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.running = false;
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    this.previousTime = 0;
    this.timeScale = 0.0;
    this.uTime = 0.0;
  }

  async load(imageSource) {
    // シェーダをロード
    const vs = await WebGLUtility.loadFile('./main.vert');
    const fs = await WebGLUtility.loadFile('./main.frag');
    this.shaderProgram = new ShaderProgram(this.gl, {
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      attribute: ['position', 'texCoord'],
      stride: [3, 2],
      uniform: ['mvpMatrix', 'textureUnit'],
      type: ['uniformMatrix4fv', 'uniform1i'],
    });

    // 渡された画像ソースからテクスチャを生成
    this.texture = await this.loadTexture(imageSource); // 非同期でテクスチャを読み込む
  }

  // 非同期で画像を読み込むメソッド
  async loadTexture(imageSource) {
    try {
      const image = await WebGLUtility.loadImage(imageSource);  // 画像の読み込みを待つ
      return this.createTextureFromImage(image);  // 画像を使ってテクスチャ作成
    } catch (error) {
      console.error('Failed to load image:', error);
      throw error;  // エラーハンドリング
    }
  }

  // 画像をテクスチャに変換するメソッド
  createTextureFromImage(image) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // テクスチャ設定
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    
    // テクスチャパラメータの設定
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // テクスチャを返す
    return texture;
  }

  setup() {
    const gl = this.gl;

    const cameraOption = {
      distance: 3.0,
      min: 1.0,
      max: 10.0,
      move: 2.0,
    };
    this.camera = new WebGLOrbitCamera(this.canvas, cameraOption);

    this.setupGeometry();
    this.resize();
    this.running = true;
    this.previousTime = Date.now();

    gl.clearColor(1.0, 1.0, 1.0, 0.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);

    // テクスチャをバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  setupGeometry() {
    this.position = [
      -1.0, 1.0, 0.0,
       1.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
       1.0, -1.0, 0.0,
    ];
    this.texCoord = [
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
    ];
    this.vbo = [
      WebGLUtility.createVbo(this.gl, this.position),
      WebGLUtility.createVbo(this.gl, this.texCoord),
    ];
  }

  render() {
    const gl = this.gl;
    const m4 = WebGLMath.Mat4;
    const v3 = WebGLMath.Vec3;

    if (this.running === true) {
      requestAnimationFrame(this.render);
    }

    const now = Date.now();
    const time = (now - this.previousTime) / 1000;
    this.uTime += time * this.timeScale;
    this.previousTime = now;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const rotateAxis = v3.create(0.0, 1.0, 0.0);
    const rotateAngle = this.uTime * 0.2;
    const m = m4.rotate(m4.identity(), rotateAngle, rotateAxis);

    const v = this.camera.update();
    const fovy = 60;
    const aspect = this.canvas.width / this.canvas.height;
    const near = 0.1;
    const far = 20.0;
    const p = m4.perspective(fovy, aspect, near, far);

    const vp = m4.multiply(p, v);
    const mvp = m4.multiply(vp, m);

    this.shaderProgram.use();
    this.shaderProgram.setAttribute(this.vbo);
    this.shaderProgram.setUniform([mvp, 0]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.position.length / 3);
  }

  resize() {
    const canvasArea = document.querySelector('.canvas-area');
    this.canvas.width = canvasArea.clientWidth;
    this.canvas.height = canvasArea.clientHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  init(canvas, option = {}) {
    if (canvas instanceof HTMLCanvasElement === true) {
      this.canvas = canvas;
    } else if (Object.prototype.toString.call(canvas) === '[object String]') {
      const c = document.querySelector(`#${canvas}`);
      if (c instanceof HTMLCanvasElement === true) {
        this.canvas = c;
      }
    }
    if (this.canvas == null) {
      throw new Error('invalid argument');
    }
    this.gl = this.canvas.getContext('webgl', option);
    if (this.gl == null) {
      throw new Error('webgl not supported');
    }
  }
}
