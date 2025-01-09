precision mediump float;

uniform sampler2D textureUnit; // テクスチャユニット @@@
varying vec2 vTexCoord; // テクスチャ座標 @@@

void main() {
  // テクスチャから色をサンプリング（抽出）する @@@
  vec4 samplerColor = texture2D(textureUnit, vTexCoord);

	// 例えば、色反転をしたいなら↓のようにサンプリングしていきた色を変換する
	// samplerColor = vec4(1.0 - samplerColor.rgb, samplerColor.a);

	// サンプリングしてくる座標の方をずらしたりもできる。アイディア次第で自由にできるので、いろいろやってみよう。
	// vec4 samplerColor = texture2D(textureUnit, vTexCoord + vec2(0.1,0.1));

  // ここではテクスチャ由来の色をそのまま出力するだけ
  gl_FragColor = samplerColor;
}
