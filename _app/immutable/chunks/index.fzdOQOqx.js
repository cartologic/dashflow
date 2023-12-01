import{G as R,aJ as vt,aw as F,_ as y,az as D,ay as k,au as z,M as O,ac as Pe,N as je,U as H,T as yt,a3 as Yt,aK as $t,aC as Oe,l as T,aA as Re,c as qt,aL as Qt,aB as en,F as xt,aE as mt,h as tn,ax as Fe}from"./tesselator.8BwnEGKI.js";import{g as nn}from"./index.SKmR1kNU.js";const on=new Uint16Array([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]),sn=new Float32Array([-1,-1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1]),rn=new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0]),an=new Float32Array([0,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1,0,1,1,1,1,0,1,0,0,1,0,1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,1]),ln={POSITION:{size:3,value:new Float32Array(sn)},NORMAL:{size:3,value:new Float32Array(rn)},TEXCOORD_0:{size:2,value:new Float32Array(an)}};class cn extends R{constructor(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};const{id:t=vt("cube-geometry")}=e;super({...e,id:t,indices:{size:1,value:new Uint16Array(on)},attributes:{...ln,...e.attributes}})}}const un=`#define SHADER_NAME arc-layer-vertex-shader

attribute vec3 positions;
attribute vec4 instanceSourceColors;
attribute vec4 instanceTargetColors;
attribute vec3 instanceSourcePositions;
attribute vec3 instanceSourcePositions64Low;
attribute vec3 instanceTargetPositions;
attribute vec3 instanceTargetPositions64Low;
attribute vec3 instancePickingColors;
attribute float instanceWidths;
attribute float instanceHeights;
attribute float instanceTilts;

uniform bool greatCircle;
uniform bool useShortestPath;
uniform float numSegments;
uniform float opacity;
uniform float widthScale;
uniform float widthMinPixels;
uniform float widthMaxPixels;
uniform int widthUnits;

varying vec4 vColor;
varying vec2 uv;
varying float isValid;

float paraboloid(float distance, float sourceZ, float targetZ, float ratio) {

  float deltaZ = targetZ - sourceZ;
  float dh = distance * instanceHeights;
  if (dh == 0.0) {
    return sourceZ + deltaZ * ratio;
  }
  float unitZ = deltaZ / dh;
  float p2 = unitZ * unitZ + 1.0;
  float dir = step(deltaZ, 0.0);
  float z0 = mix(sourceZ, targetZ, dir);
  float r = mix(ratio, 1.0 - ratio, dir);
  return sqrt(r * (p2 - r)) * dh + z0;
}
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
  vec2 dir_screenspace = normalize(line_clipspace * project_uViewportSize);
  dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);

  return dir_screenspace * offset_direction * width / 2.0;
}

float getSegmentRatio(float index) {
  return smoothstep(0.0, 1.0, index / (numSegments - 1.0));
}

vec3 interpolateFlat(vec3 source, vec3 target, float segmentRatio) {
  float distance = length(source.xy - target.xy);
  float z = paraboloid(distance, source.z, target.z, segmentRatio);

  float tiltAngle = radians(instanceTilts);
  vec2 tiltDirection = normalize(target.xy - source.xy);
  vec2 tilt = vec2(-tiltDirection.y, tiltDirection.x) * z * sin(tiltAngle);

  return vec3(
    mix(source.xy, target.xy, segmentRatio) + tilt,
    z * cos(tiltAngle)
  );
}
float getAngularDist (vec2 source, vec2 target) {
  vec2 sourceRadians = radians(source);
  vec2 targetRadians = radians(target);
  vec2 sin_half_delta = sin((sourceRadians - targetRadians) / 2.0);
  vec2 shd_sq = sin_half_delta * sin_half_delta;

  float a = shd_sq.y + cos(sourceRadians.y) * cos(targetRadians.y) * shd_sq.x;
  return 2.0 * asin(sqrt(a));
}

vec3 interpolateGreatCircle(vec3 source, vec3 target, vec3 source3D, vec3 target3D, float angularDist, float t) {
  vec2 lngLat;
  if(abs(angularDist - PI) < 0.001) {
    lngLat = (1.0 - t) * source.xy + t * target.xy;
  } else {
    float a = sin((1.0 - t) * angularDist);
    float b = sin(t * angularDist);
    vec3 p = source3D.yxz * a + target3D.yxz * b;
    lngLat = degrees(vec2(atan(p.y, -p.x), atan(p.z, length(p.xy))));
  }

  float z = paraboloid(angularDist * EARTH_RADIUS, source.z, target.z, t);

  return vec3(lngLat, z);
}

void main(void) {
  geometry.worldPosition = instanceSourcePositions;
  geometry.worldPositionAlt = instanceTargetPositions;

  float segmentIndex = positions.x;
  float segmentRatio = getSegmentRatio(segmentIndex);
  float prevSegmentRatio = getSegmentRatio(max(0.0, segmentIndex - 1.0));
  float nextSegmentRatio = getSegmentRatio(min(numSegments - 1.0, segmentIndex + 1.0));
  float indexDir = mix(-1.0, 1.0, step(segmentIndex, 0.0));
  isValid = 1.0;

  uv = vec2(segmentRatio, positions.y);
  geometry.uv = uv;
  geometry.pickingColor = instancePickingColors;

  vec4 curr;
  vec4 next;
  vec3 source;
  vec3 target;

  if ((greatCircle || project_uProjectionMode == PROJECTION_MODE_GLOBE) && project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
    source = project_globe_(vec3(instanceSourcePositions.xy, 0.0));
    target = project_globe_(vec3(instanceTargetPositions.xy, 0.0));
    float angularDist = getAngularDist(instanceSourcePositions.xy, instanceTargetPositions.xy);

    vec3 prevPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, prevSegmentRatio);
    vec3 currPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, segmentRatio);
    vec3 nextPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, nextSegmentRatio);

    if (abs(currPos.x - prevPos.x) > 180.0) {
      indexDir = -1.0;
      isValid = 0.0;
    } else if (abs(currPos.x - nextPos.x) > 180.0) {
      indexDir = 1.0;
      isValid = 0.0;
    }
    nextPos = indexDir < 0.0 ? prevPos : nextPos;
    nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;

    if (isValid == 0.0) {
      nextPos.x += nextPos.x > 0.0 ? -360.0 : 360.0;
      float t = ((currPos.x > 0.0 ? 180.0 : -180.0) - currPos.x) / (nextPos.x - currPos.x);
      currPos = mix(currPos, nextPos, t);
      segmentRatio = mix(segmentRatio, nextSegmentRatio, t);
    }

    vec3 currPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, segmentRatio);
    vec3 nextPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, nextSegmentRatio);
  
    curr = project_position_to_clipspace(currPos, currPos64Low, vec3(0.0), geometry.position);
    next = project_position_to_clipspace(nextPos, nextPos64Low, vec3(0.0));
  
  } else {
    vec3 source_world = instanceSourcePositions;
    vec3 target_world = instanceTargetPositions;
    if (useShortestPath) {
      source_world.x = mod(source_world.x + 180., 360.0) - 180.;
      target_world.x = mod(target_world.x + 180., 360.0) - 180.;

      float deltaLng = target_world.x - source_world.x;
      if (deltaLng > 180.) target_world.x -= 360.;
      if (deltaLng < -180.) source_world.x -= 360.;
    }
    source = project_position(source_world, instanceSourcePositions64Low);
    target = project_position(target_world, instanceTargetPositions64Low);
    float antiMeridianX = 0.0;

    if (useShortestPath) {
      if (project_uProjectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
        antiMeridianX = -(project_uCoordinateOrigin.x + 180.) / 360. * TILE_SIZE;
      }
      float thresholdRatio = (antiMeridianX - source.x) / (target.x - source.x);

      if (prevSegmentRatio <= thresholdRatio && nextSegmentRatio > thresholdRatio) {
        isValid = 0.0;
        indexDir = sign(segmentRatio - thresholdRatio);
        segmentRatio = thresholdRatio;
      }
    }

    nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;
    vec3 currPos = interpolateFlat(source, target, segmentRatio);
    vec3 nextPos = interpolateFlat(source, target, nextSegmentRatio);

    if (useShortestPath) {
      if (nextPos.x < antiMeridianX) {
        currPos.x += TILE_SIZE;
        nextPos.x += TILE_SIZE;
      }
    }

    curr = project_common_position_to_clipspace(vec4(currPos, 1.0));
    next = project_common_position_to_clipspace(vec4(nextPos, 1.0));
    geometry.position = vec4(currPos, 1.0);
  }
  float widthPixels = clamp(
    project_size_to_pixel(instanceWidths * widthScale, widthUnits),
    widthMinPixels, widthMaxPixels
  );
  vec3 offset = vec3(
    getExtrusionOffset((next.xy - curr.xy) * indexDir, positions.y, widthPixels),
    0.0);
  DECKGL_FILTER_SIZE(offset, geometry);
  DECKGL_FILTER_GL_POSITION(curr, geometry);
  gl_Position = curr + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);

  vec4 color = mix(instanceSourceColors, instanceTargetColors, segmentRatio);
  vColor = vec4(color.rgb, color.a * opacity);
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`,dn=`#define SHADER_NAME arc-layer-fragment-shader

precision highp float;

varying vec4 vColor;
varying vec2 uv;
varying float isValid;

void main(void) {
  if (isValid == 0.0) {
    discard;
  }

  gl_FragColor = vColor;
  geometry.uv = uv;

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,ue=[0,0,0,255],gn={getSourcePosition:{type:"accessor",value:n=>n.sourcePosition},getTargetPosition:{type:"accessor",value:n=>n.targetPosition},getSourceColor:{type:"accessor",value:ue},getTargetColor:{type:"accessor",value:ue},getWidth:{type:"accessor",value:1},getHeight:{type:"accessor",value:1},getTilt:{type:"accessor",value:0},greatCircle:!1,numSegments:{type:"number",value:50,min:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0}};class Pt extends F{constructor(...e){super(...e),y(this,"state",void 0)}getBounds(){var e;return(e=this.getAttributeManager())===null||e===void 0?void 0:e.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){return super.getShaders({vs:un,fs:dn,modules:[D,k]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getTargetPosition"},instanceSourceColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:!0,accessor:"getSourceColor",defaultValue:ue},instanceTargetColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:!0,accessor:"getTargetColor",defaultValue:ue},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1},instanceHeights:{size:1,transition:!0,accessor:"getHeight",defaultValue:1},instanceTilts:{size:1,transition:!0,accessor:"getTilt",defaultValue:0}})}updateState(e){super.updateState(e);const{props:t,oldProps:i,changeFlags:o}=e;if(o.extensionsChanged||o.propsChanged&&t.numSegments!==i.numSegments){var s;const{gl:r}=this.context;(s=this.state.model)===null||s===void 0||s.delete(),this.state.model=this._getModel(r),this.getAttributeManager().invalidateAll()}}draw({uniforms:e}){const{widthUnits:t,widthScale:i,widthMinPixels:o,widthMaxPixels:s,greatCircle:r,wrapLongitude:a}=this.props;this.state.model.setUniforms(e).setUniforms({greatCircle:r,widthUnits:z[t],widthScale:i,widthMinPixels:o,widthMaxPixels:s,useShortestPath:a}).draw()}_getModel(e){const{id:t,numSegments:i}=this.props;let o=[];for(let r=0;r<i;r++)o=o.concat([r,1,0,r,-1,0]);const s=new O(e,{...this.getShaders(),id:t,geometry:new R({drawMode:5,attributes:{positions:new Float32Array(o)}}),isInstanced:!0});return s.setUniforms({numSegments:i}),s}}y(Pt,"layerName","ArcLayer");y(Pt,"defaultProps",gn);const fn=new Uint16Array([0,2,1,0,3,2]),pn=new Float32Array([0,1,0,0,1,0,1,1]);function hn(n,e){if(!e)return vn(n);const t=Math.max(Math.abs(n[0][0]-n[3][0]),Math.abs(n[1][0]-n[2][0])),i=Math.max(Math.abs(n[1][1]-n[0][1]),Math.abs(n[2][1]-n[3][1])),o=Math.ceil(t/e)+1,s=Math.ceil(i/e)+1,r=(o-1)*(s-1)*6,a=new Uint32Array(r),l=new Float32Array(o*s*2),c=new Float64Array(o*s*3);let u=0,d=0;for(let g=0;g<o;g++){const f=g/(o-1);for(let p=0;p<s;p++){const h=p/(s-1),v=yn(n,f,h);c[u*3+0]=v[0],c[u*3+1]=v[1],c[u*3+2]=v[2]||0,l[u*2+0]=f,l[u*2+1]=1-h,g>0&&p>0&&(a[d++]=u-s,a[d++]=u-s-1,a[d++]=u-1,a[d++]=u-s,a[d++]=u-1,a[d++]=u),u++}}return{vertexCount:r,positions:c,indices:a,texCoords:l}}function vn(n){const e=new Float64Array(12);for(let t=0;t<n.length;t++)e[t*3+0]=n[t][0],e[t*3+1]=n[t][1],e[t*3+2]=n[t][2]||0;return{vertexCount:6,positions:e,indices:fn,texCoords:pn}}function yn(n,e,t){return Pe(Pe(n[0],n[1],t),Pe(n[3],n[2],t),e)}const xn=`
#define SHADER_NAME bitmap-layer-vertex-shader

attribute vec2 texCoords;
attribute vec3 positions;
attribute vec3 positions64Low;

varying vec2 vTexCoord;
varying vec2 vTexPos;

uniform float coordinateConversion;

const vec3 pickingColor = vec3(1.0, 0.0, 0.0);

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = pickingColor;

  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vTexCoord = texCoords;

  if (coordinateConversion < -0.5) {
    vTexPos = geometry.position.xy + project_uCommonOrigin.xy;
  } else if (coordinateConversion > 0.5) {
    vTexPos = geometry.worldPosition.xy;
  }

  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`,mn=`
vec3 packUVsIntoRGB(vec2 uv) {
  // Extract the top 8 bits. We want values to be truncated down so we can add a fraction
  vec2 uv8bit = floor(uv * 256.);

  // Calculate the normalized remainders of u and v parts that do not fit into 8 bits
  // Scale and clamp to 0-1 range
  vec2 uvFraction = fract(uv * 256.);
  vec2 uvFraction4bit = floor(uvFraction * 16.);

  // Remainder can be encoded in blue channel, encode as 4 bits for pixel coordinates
  float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;

  return vec3(uv8bit, fractions) / 255.;
}
`,Pn=`
#define SHADER_NAME bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

varying vec2 vTexCoord;
varying vec2 vTexPos;

uniform float desaturate;
uniform vec4 transparentColor;
uniform vec3 tintColor;
uniform float opacity;

uniform float coordinateConversion;
uniform vec4 bounds;

/* projection utils */
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

// from degrees to Web Mercator
vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
vec2 mercator_to_lnglat(vec2 xy) {
  xy /= WORLD_SCALE;
  return degrees(vec2(
    xy.x - PI,
    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
  ));
}
/* End projection utils */

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  if (transparentColor.a == 0.0) {
    return vec4(color, alpha);
  }
  float blendedAlpha = alpha + transparentColor.a * (1.0 - alpha);
  float highLightRatio = alpha / blendedAlpha;
  vec3 blendedRGB = mix(transparentColor.rgb, color, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bounds[0]) / (bounds[2] - bounds[0]),
    (pos.y - bounds[3]) / (bounds[1] - bounds[3])
  );
}

`.concat(mn,`

void main(void) {
  vec2 uv = vTexCoord;
  if (coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }
  vec4 bitmapColor = texture2D(bitmapTexture, uv);

  gl_FragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);

  if (picking_uActive && !picking_uAttribute) {
    // Since instance information is not used, we can use picking color for pixel index
    gl_FragColor.rgb = packUVsIntoRGB(uv);
  }
}
`),_n={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:H.DEFAULT,desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0}};class _t extends F{constructor(...e){super(...e),y(this,"state",void 0)}getShaders(){return super.getShaders({vs:xn,fs:Pn,modules:[D,k]})}initializeState(){const e=this.getAttributeManager();e.remove(["instancePickingColors"]);const t=!0;e.add({indices:{size:1,isIndexed:!0,update:i=>i.value=this.state.mesh.indices,noAlloc:t},positions:{size:3,type:5130,fp64:this.use64bitPositions(),update:i=>i.value=this.state.mesh.positions,noAlloc:t},texCoords:{size:2,update:i=>i.value=this.state.mesh.texCoords,noAlloc:t}})}updateState({props:e,oldProps:t,changeFlags:i}){const o=this.getAttributeManager();if(i.extensionsChanged){var s;const{gl:r}=this.context;(s=this.state.model)===null||s===void 0||s.delete(),this.state.model=this._getModel(r),o.invalidateAll()}if(e.bounds!==t.bounds){const r=this.state.mesh,a=this._createMesh();this.state.model.setVertexCount(a.vertexCount);for(const l in a)r&&r[l]!==a[l]&&o.invalidate(l);this.setState({mesh:a,...this._getCoordinateUniforms()})}else e._imageCoordinateSystem!==t._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(e){const{image:t}=this.props,i=e.info;if(!i.color||!t)return i.bitmap=null,i;const{width:o,height:s}=t;i.index=0;const r=Cn(i.color),a=[Math.floor(r[0]*o),Math.floor(r[1]*s)];return i.bitmap={size:{width:o,height:s},uv:r,pixel:a},i}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(e){super._updateAutoHighlight({...e,color:this.encodePickingColor(0)})}_createMesh(){const{bounds:e}=this.props;let t=e;return He(e)&&(t=[[e[0],e[1]],[e[0],e[3]],[e[2],e[3]],[e[2],e[1]]]),hn(t,this.context.viewport.resolution)}_getModel(e){return e?new O(e,{...this.getShaders(),id:this.props.id,geometry:new R({drawMode:4,vertexCount:6}),isInstanced:!1}):null}draw(e){const{uniforms:t,moduleParameters:i}=e,{model:o,coordinateConversion:s,bounds:r,disablePicking:a}=this.state,{image:l,desaturate:c,transparentColor:u,tintColor:d}=this.props;i.pickingActive&&a||l&&o&&o.setUniforms(t).setUniforms({bitmapTexture:l,desaturate:c,transparentColor:u.map(g=>g/255),tintColor:d.slice(0,3).map(g=>g/255),coordinateConversion:s,bounds:r}).draw()}_getCoordinateUniforms(){const{LNGLAT:e,CARTESIAN:t,DEFAULT:i}=H;let{_imageCoordinateSystem:o}=this.props;if(o!==i){const{bounds:s}=this.props;if(!He(s))throw new Error("_imageCoordinateSystem only supports rectangular bounds");const r=this.context.viewport.resolution?e:t;if(o=o===e?e:t,o===e&&r===t)return{coordinateConversion:-1,bounds:s};if(o===t&&r===e){const a=je([s[0],s[1]]),l=je([s[2],s[3]]);return{coordinateConversion:1,bounds:[a[0],a[1],l[0],l[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}y(_t,"layerName","BitmapLayer");y(_t,"defaultProps",_n);function Cn(n){const[e,t,i]=n,o=(i&240)/256,s=(i&15)/16;return[(e+s)/256,(t+o)/256]}function He(n){return Number.isFinite(n[0])}const Ln=`#define SHADER_NAME icon-layer-vertex-shader

attribute vec2 positions;

attribute vec3 instancePositions;
attribute vec3 instancePositions64Low;
attribute float instanceSizes;
attribute float instanceAngles;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;
attribute vec4 instanceIconFrames;
attribute float instanceColorModes;
attribute vec2 instanceOffsets;
attribute vec2 instancePixelOffset;

uniform float sizeScale;
uniform vec2 iconsTextureDim;
uniform float sizeMinPixels;
uniform float sizeMaxPixels;
uniform bool billboard;
uniform int sizeUnits;

varying float vColorMode;
varying vec4 vColor;
varying vec2 vTextureCoords;
varying vec2 uv;

vec2 rotate_by_angle(vec2 vertex, float angle) {
  float angle_radian = angle * PI / 180.0;
  float cos_angle = cos(angle_radian);
  float sin_angle = sin(angle_radian);
  mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
  return rotationMatrix * vertex;
}

void main(void) {
  geometry.worldPosition = instancePositions;
  geometry.uv = positions;
  geometry.pickingColor = instancePickingColors;
  uv = positions;

  vec2 iconSize = instanceIconFrames.zw;
  float sizePixels = clamp(
    project_size_to_pixel(instanceSizes * sizeScale, sizeUnits), 
    sizeMinPixels, sizeMaxPixels
  );
  float instanceScale = iconSize.y == 0.0 ? 0.0 : sizePixels / iconSize.y;
  vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
  pixelOffset += instancePixelOffset;
  pixelOffset.y *= -1.0;

  if (billboard)  {
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
    vec3 offset = vec3(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(offset, geometry);
    gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);

  } else {
    vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
    DECKGL_FILTER_SIZE(offset_common, geometry);
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position); 
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  }

  vTextureCoords = mix(
    instanceIconFrames.xy,
    instanceIconFrames.xy + iconSize,
    (positions.xy + 1.0) / 2.0
  ) / iconsTextureDim;

  vColor = instanceColors;
  DECKGL_FILTER_COLOR(vColor, geometry);

  vColorMode = instanceColorModes;
}
`,Sn=`#define SHADER_NAME icon-layer-fragment-shader

precision highp float;

uniform float opacity;
uniform sampler2D iconsTexture;
uniform float alphaCutoff;

varying float vColorMode;
varying vec4 vColor;
varying vec2 vTextureCoords;
varying vec2 uv;

void main(void) {
  geometry.uv = uv;

  vec4 texColor = texture2D(iconsTexture, vTextureCoords);
  vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
  float a = texColor.a * opacity * vColor.a;

  if (a < alphaCutoff) {
    discard;
  }

  gl_FragColor = vec4(color, a);
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,wn=1024,bn=4,Ze=()=>{},Ke={10241:9987,10240:9729,10242:33071,10243:33071};function En(n){return Math.pow(2,Math.ceil(Math.log2(n)))}function An(n,e,t,i){const o=Math.min(t/e.width,i/e.height),s=Math.floor(e.width*o),r=Math.floor(e.height*o);return o===1?{data:e,width:s,height:r}:(n.canvas.height=r,n.canvas.width=s,n.clearRect(0,0,s,r),n.drawImage(e,0,0,e.width,e.height,0,0,s,r),{data:n.canvas,width:s,height:r})}function K(n){return n&&(n.id||n.url)}function Tn(n,e,t,i){const o=n.width,s=n.height,r=new yt(n.gl,{width:e,height:t,parameters:i});return $t(n,r,{targetY:0,width:o,height:s}),n.delete(),r}function Xe(n,e,t){for(let i=0;i<e.length;i++){const{icon:o,xOffset:s}=e[i],r=K(o);n[r]={...o,x:s,y:t}}}function In({icons:n,buffer:e,mapping:t={},xOffset:i=0,yOffset:o=0,rowHeight:s=0,canvasWidth:r}){let a=[];for(let l=0;l<n.length;l++){const c=n[l],u=K(c);if(!t[u]){const{height:d,width:g}=c;i+g+e>r&&(Xe(t,a,o),i=0,o=s+o+e,s=0,a=[]),a.push({icon:c,xOffset:i}),i=i+g+e,s=Math.max(s,d)}}return a.length>0&&Xe(t,a,o),{mapping:t,rowHeight:s,xOffset:i,yOffset:o,canvasWidth:r,canvasHeight:En(s+o+e)}}function Mn(n,e,t){if(!n||!e)return null;t=t||{};const i={},{iterable:o,objectInfo:s}=Oe(n);for(const r of o){s.index++;const a=e(r,s),l=K(a);if(!a)throw new Error("Icon is missing.");if(!a.url)throw new Error("Icon url is missing.");!i[l]&&(!t[l]||a.url!==t[l].url)&&(i[l]={...a,source:r,sourceIndex:s.index})}return i}class zn{constructor(e,{onUpdate:t=Ze,onError:i=Ze}){y(this,"gl",void 0),y(this,"onUpdate",void 0),y(this,"onError",void 0),y(this,"_loadOptions",null),y(this,"_texture",null),y(this,"_externalTexture",null),y(this,"_mapping",{}),y(this,"_textureParameters",null),y(this,"_pendingCount",0),y(this,"_autoPacking",!1),y(this,"_xOffset",0),y(this,"_yOffset",0),y(this,"_rowHeight",0),y(this,"_buffer",bn),y(this,"_canvasWidth",wn),y(this,"_canvasHeight",0),y(this,"_canvas",null),this.gl=e,this.onUpdate=t,this.onError=i}finalize(){var e;(e=this._texture)===null||e===void 0||e.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){const t=this._autoPacking?K(e):e;return this._mapping[t]||{}}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:o,textureParameters:s}){if(e&&(this._loadOptions=e),t!==void 0&&(this._autoPacking=t),o&&(this._mapping=o),i){var r;(r=this._texture)===null||r===void 0||r.delete(),this._texture=null,this._externalTexture=i}s&&(this._textureParameters=s)}get isLoaded(){return this._pendingCount===0}packIcons(e,t){if(!this._autoPacking||typeof document>"u")return;const i=Object.values(Mn(e,t,this._mapping)||{});if(i.length>0){const{mapping:o,xOffset:s,yOffset:r,rowHeight:a,canvasHeight:l}=In({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=a,this._mapping=o,this._xOffset=s,this._yOffset=r,this._canvasHeight=l,this._texture||(this._texture=new yt(this.gl,{width:this._canvasWidth,height:this._canvasHeight,parameters:this._textureParameters||Ke})),this._texture.height!==this._canvasHeight&&(this._texture=Tn(this._texture,this._canvasWidth,this._canvasHeight,this._textureParameters||Ke)),this.onUpdate(),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){const t=this._canvas.getContext("2d",{willReadFrequently:!0});for(const i of e)this._pendingCount++,Yt(i.url,this._loadOptions).then(o=>{const s=K(i),r=this._mapping[s],{x:a,y:l,width:c,height:u}=r,{data:d,width:g,height:f}=An(t,o,c,u);this._texture.setSubImageData({data:d,x:a+(c-g)/2,y:l+(u-f)/2,width:g,height:f}),r.width=g,r.height=f,this._texture.generateMipmap(),this.onUpdate()}).catch(o=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:o})}).finally(()=>{this._pendingCount--})}}const Ct=[0,0,0,255],On={iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:n=>n.position},getIcon:{type:"accessor",value:n=>n.icon},getColor:{type:"accessor",value:Ct},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0}};class pe extends F{constructor(...e){super(...e),y(this,"state",void 0)}getShaders(){return super.getShaders({vs:Ln,fs:Sn,modules:[D,k]})}initializeState(){this.state={iconManager:new zn(this.context.gl,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceOffsets:{size:2,accessor:"getIcon",transform:this.getInstanceOffset},instanceIconFrames:{size:4,accessor:"getIcon",transform:this.getInstanceIconFrame},instanceColorModes:{size:1,type:5121,accessor:"getIcon",transform:this.getInstanceColorMode},instanceColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:!0,accessor:"getColor",defaultValue:Ct},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset"}})}updateState(e){super.updateState(e);const{props:t,oldProps:i,changeFlags:o}=e,s=this.getAttributeManager(),{iconAtlas:r,iconMapping:a,data:l,getIcon:c,textureParameters:u}=t,{iconManager:d}=this.state,g=r||this.internalState.isAsyncPropLoading("iconAtlas");if(d.setProps({loadOptions:t.loadOptions,autoPacking:!g,iconAtlas:r,iconMapping:g?a:null,textureParameters:u}),g?i.iconMapping!==t.iconMapping&&s.invalidate("getIcon"):(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getIcon))&&d.packIcons(l,c),o.extensionsChanged){var f;const{gl:p}=this.context;(f=this.state.model)===null||f===void 0||f.delete(),this.state.model=this._getModel(p),s.invalidateAll()}}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){const{sizeScale:t,sizeMinPixels:i,sizeMaxPixels:o,sizeUnits:s,billboard:r,alphaCutoff:a}=this.props,{iconManager:l}=this.state,c=l.getTexture();c&&this.state.model.setUniforms(e).setUniforms({iconsTexture:c,iconsTextureDim:[c.width,c.height],sizeUnits:z[s],sizeScale:t,sizeMinPixels:i,sizeMaxPixels:o,billboard:r,alphaCutoff:a}).draw()}_getModel(e){const t=[-1,-1,-1,1,1,1,1,-1];return new O(e,{...this.getShaders(),id:this.props.id,geometry:new R({drawMode:6,attributes:{positions:{size:2,value:new Float32Array(t)}}}),isInstanced:!0})}_onUpdate(){this.setNeedsRedraw()}_onError(e){var t;const i=(t=this.getCurrentLayer())===null||t===void 0?void 0:t.props.onIconError;i?i(e):T.error(e.error.message)()}getInstanceOffset(e){const{width:t,height:i,anchorX:o=t/2,anchorY:s=i/2}=this.state.iconManager.getIconMapping(e);return[t/2-o,i/2-s]}getInstanceColorMode(e){return this.state.iconManager.getIconMapping(e).mask?1:0}getInstanceIconFrame(e){const{x:t,y:i,width:o,height:s}=this.state.iconManager.getIconMapping(e);return[t,i,o,s]}}y(pe,"defaultProps",On);y(pe,"layerName","IconLayer");const Rn=`#define SHADER_NAME line-layer-vertex-shader

attribute vec3 positions;
attribute vec3 instanceSourcePositions;
attribute vec3 instanceTargetPositions;
attribute vec3 instanceSourcePositions64Low;
attribute vec3 instanceTargetPositions64Low;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;
attribute float instanceWidths;

uniform float opacity;
uniform float widthScale;
uniform float widthMinPixels;
uniform float widthMaxPixels;
uniform float useShortestPath;
uniform int widthUnits;

varying vec4 vColor;
varying vec2 uv;
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
  vec2 dir_screenspace = normalize(line_clipspace * project_uViewportSize);
  dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);

  return dir_screenspace * offset_direction * width / 2.0;
}

vec3 splitLine(vec3 a, vec3 b, float x) {
  float t = (x - a.x) / (b.x - a.x);
  return vec3(x, mix(a.yz, b.yz, t));
}

void main(void) {
  geometry.worldPosition = instanceSourcePositions;
  geometry.worldPositionAlt = instanceTargetPositions;

  vec3 source_world = instanceSourcePositions;
  vec3 target_world = instanceTargetPositions;
  vec3 source_world_64low = instanceSourcePositions64Low;
  vec3 target_world_64low = instanceTargetPositions64Low;

  if (useShortestPath > 0.5 || useShortestPath < -0.5) {
    source_world.x = mod(source_world.x + 180., 360.0) - 180.;
    target_world.x = mod(target_world.x + 180., 360.0) - 180.;
    float deltaLng = target_world.x - source_world.x;

    if (deltaLng * useShortestPath > 180.) {
      source_world.x += 360. * useShortestPath;
      source_world = splitLine(source_world, target_world, 180. * useShortestPath);
      source_world_64low = vec3(0.0);
    } else if (deltaLng * useShortestPath < -180.) {
      target_world.x += 360. * useShortestPath;
      target_world = splitLine(source_world, target_world, 180. * useShortestPath);
      target_world_64low = vec3(0.0);
    } else if (useShortestPath < 0.) {
      gl_Position = vec4(0.);
      return;
    }
  }
  vec4 source_commonspace;
  vec4 target_commonspace;
  vec4 source = project_position_to_clipspace(source_world, source_world_64low, vec3(0.), source_commonspace);
  vec4 target = project_position_to_clipspace(target_world, target_world_64low, vec3(0.), target_commonspace);
  float segmentIndex = positions.x;
  vec4 p = mix(source, target, segmentIndex);
  geometry.position = mix(source_commonspace, target_commonspace, segmentIndex);
  uv = positions.xy;
  geometry.uv = uv;
  geometry.pickingColor = instancePickingColors;
  float widthPixels = clamp(
    project_size_to_pixel(instanceWidths * widthScale, widthUnits),
    widthMinPixels, widthMaxPixels
  );
  vec3 offset = vec3(
    getExtrusionOffset(target.xy - source.xy, positions.y, widthPixels),
    0.0);
  DECKGL_FILTER_SIZE(offset, geometry);
  DECKGL_FILTER_GL_POSITION(p, geometry);
  gl_Position = p + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);
  vColor = vec4(instanceColors.rgb, instanceColors.a * opacity);
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`,Fn=`#define SHADER_NAME line-layer-fragment-shader

precision highp float;

varying vec4 vColor;
varying vec2 uv;

void main(void) {
  geometry.uv = uv;

  gl_FragColor = vColor;

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,Dn=[0,0,0,255],kn={getSourcePosition:{type:"accessor",value:n=>n.sourcePosition},getTargetPosition:{type:"accessor",value:n=>n.targetPosition},getColor:{type:"accessor",value:Dn},getWidth:{type:"accessor",value:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0}};class Lt extends F{getBounds(){var e;return(e=this.getAttributeManager())===null||e===void 0?void 0:e.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){return super.getShaders({vs:Rn,fs:Fn,modules:[D,k]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getTargetPosition"},instanceColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:!0,accessor:"getColor",defaultValue:[0,0,0,255]},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1}})}updateState(e){if(super.updateState(e),e.changeFlags.extensionsChanged){var t;const{gl:i}=this.context;(t=this.state.model)===null||t===void 0||t.delete(),this.state.model=this._getModel(i),this.getAttributeManager().invalidateAll()}}draw({uniforms:e}){const{widthUnits:t,widthScale:i,widthMinPixels:o,widthMaxPixels:s,wrapLongitude:r}=this.props;this.state.model.setUniforms(e).setUniforms({widthUnits:z[t],widthScale:i,widthMinPixels:o,widthMaxPixels:s,useShortestPath:r?1:0}).draw(),r&&this.state.model.setUniforms({useShortestPath:-1}).draw()}_getModel(e){const t=[0,-1,0,0,1,0,1,-1,0,1,1,0];return new O(e,{...this.getShaders(),id:this.props.id,geometry:new R({drawMode:5,attributes:{positions:new Float32Array(t)}}),isInstanced:!0})}}y(Lt,"layerName","LineLayer");y(Lt,"defaultProps",kn);const Nn=`#define SHADER_NAME point-cloud-layer-vertex-shader

attribute vec3 positions;
attribute vec3 instanceNormals;
attribute vec4 instanceColors;
attribute vec3 instancePositions;
attribute vec3 instancePositions64Low;
attribute vec3 instancePickingColors;

uniform float opacity;
uniform float radiusPixels;
uniform int sizeUnits;

varying vec4 vColor;
varying vec2 unitPosition;

void main(void) {
  geometry.worldPosition = instancePositions;
  geometry.normal = project_normal(instanceNormals);
  unitPosition = positions.xy;
  geometry.uv = unitPosition;
  geometry.pickingColor = instancePickingColors;
  vec3 offset = vec3(positions.xy * project_size_to_pixel(radiusPixels, sizeUnits), 0.0);
  DECKGL_FILTER_SIZE(offset, geometry);

  gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
  vec3 lightColor = lighting_getLightColor(instanceColors.rgb, project_uCameraPosition, geometry.position.xyz, geometry.normal);
  vColor = vec4(lightColor, instanceColors.a * opacity);
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`,Wn=`#define SHADER_NAME point-cloud-layer-fragment-shader

precision highp float;

varying vec4 vColor;
varying vec2 unitPosition;

void main(void) {
  geometry.uv = unitPosition;

  float distToCenter = length(unitPosition);

  if (distToCenter > 1.0) {
    discard;
  }

  gl_FragColor = vColor;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,St=[0,0,0,255],wt=[0,0,1],Un={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},getPosition:{type:"accessor",value:n=>n.position},getNormal:{type:"accessor",value:wt},getColor:{type:"accessor",value:St},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};function Gn(n){const{header:e,attributes:t}=n;!e||!t||(n.length=e.vertexCount,t.POSITION&&(t.instancePositions=t.POSITION),t.NORMAL&&(t.instanceNormals=t.NORMAL),t.COLOR_0&&(t.instanceColors=t.COLOR_0))}class bt extends F{getShaders(){return super.getShaders({vs:Nn,fs:Wn,modules:[D,Re,k]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:wt},instanceColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:!0,accessor:"getColor",defaultValue:St}})}updateState(e){const{changeFlags:t,props:i}=e;if(super.updateState(e),t.extensionsChanged){var o;const{gl:s}=this.context;(o=this.state.model)===null||o===void 0||o.delete(),this.state.model=this._getModel(s),this.getAttributeManager().invalidateAll()}t.dataChanged&&Gn(i.data)}draw({uniforms:e}){const{pointSize:t,sizeUnits:i}=this.props;this.state.model.setUniforms(e).setUniforms({sizeUnits:z[i],radiusPixels:t}).draw()}_getModel(e){const t=[];for(let i=0;i<3;i++){const o=i/3*Math.PI*2;t.push(Math.cos(o)*2,Math.sin(o)*2,0)}return new O(e,{...this.getShaders(),id:this.props.id,geometry:new R({drawMode:4,attributes:{positions:new Float32Array(t)}}),isInstanced:!0})}}y(bt,"layerName","PointCloudLayer");y(bt,"defaultProps",Un);const Bn=`#define SHADER_NAME scatterplot-layer-vertex-shader

attribute vec3 positions;

attribute vec3 instancePositions;
attribute vec3 instancePositions64Low;
attribute float instanceRadius;
attribute float instanceLineWidths;
attribute vec4 instanceFillColors;
attribute vec4 instanceLineColors;
attribute vec3 instancePickingColors;

uniform float opacity;
uniform float radiusScale;
uniform float radiusMinPixels;
uniform float radiusMaxPixels;
uniform float lineWidthScale;
uniform float lineWidthMinPixels;
uniform float lineWidthMaxPixels;
uniform float stroked;
uniform bool filled;
uniform bool antialiasing;
uniform bool billboard;
uniform int radiusUnits;
uniform int lineWidthUnits;

varying vec4 vFillColor;
varying vec4 vLineColor;
varying vec2 unitPosition;
varying float innerUnitRadius;
varying float outerRadiusPixels;


void main(void) {
  geometry.worldPosition = instancePositions;
  outerRadiusPixels = clamp(
    project_size_to_pixel(radiusScale * instanceRadius, radiusUnits),
    radiusMinPixels, radiusMaxPixels
  );
  float lineWidthPixels = clamp(
    project_size_to_pixel(lineWidthScale * instanceLineWidths, lineWidthUnits),
    lineWidthMinPixels, lineWidthMaxPixels
  );
  outerRadiusPixels += stroked * lineWidthPixels / 2.0;
  float edgePadding = antialiasing ? (outerRadiusPixels + SMOOTH_EDGE_RADIUS) / outerRadiusPixels : 1.0;
  unitPosition = edgePadding * positions.xy;
  geometry.uv = unitPosition;
  geometry.pickingColor = instancePickingColors;

  innerUnitRadius = 1.0 - stroked * lineWidthPixels / outerRadiusPixels;
  
  if (billboard) {
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
    vec3 offset = edgePadding * positions * outerRadiusPixels;
    DECKGL_FILTER_SIZE(offset, geometry);
    gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
  } else {
    vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
    DECKGL_FILTER_SIZE(offset, geometry);
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  }
  vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * opacity);
  DECKGL_FILTER_COLOR(vFillColor, geometry);
  vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * opacity);
  DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,Vn=`#define SHADER_NAME scatterplot-layer-fragment-shader

precision highp float;

uniform bool filled;
uniform float stroked;
uniform bool antialiasing;

varying vec4 vFillColor;
varying vec4 vLineColor;
varying vec2 unitPosition;
varying float innerUnitRadius;
varying float outerRadiusPixels;

void main(void) {
  geometry.uv = unitPosition;

  float distToCenter = length(unitPosition) * outerRadiusPixels;
  float inCircle = antialiasing ? 
    smoothedge(distToCenter, outerRadiusPixels) : 
    step(distToCenter, outerRadiusPixels);

  if (inCircle == 0.0) {
    discard;
  }

  if (stroked > 0.5) {
    float isLine = antialiasing ? 
      smoothedge(innerUnitRadius * outerRadiusPixels, distToCenter) :
      step(innerUnitRadius * outerRadiusPixels, distToCenter);

    if (filled) {
      gl_FragColor = mix(vFillColor, vLineColor, isLine);
    } else {
      if (isLine == 0.0) {
        discard;
      }
      gl_FragColor = vec4(vLineColor.rgb, vLineColor.a * isLine);
    }
  } else if (!filled) {
    discard;
  } else {
    gl_FragColor = vFillColor;
  }

  gl_FragColor.a *= inCircle;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,Je=[0,0,0,255],jn={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:n=>n.position},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:Je},getLineColor:{type:"accessor",value:Je},getLineWidth:{type:"accessor",value:1},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class De extends F{getShaders(){return super.getShaders({vs:Bn,fs:Vn,modules:[D,k]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,normalized:!0,type:5121,accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,normalized:!0,type:5121,accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){if(super.updateState(e),e.changeFlags.extensionsChanged){var t;const{gl:i}=this.context;(t=this.state.model)===null||t===void 0||t.delete(),this.state.model=this._getModel(i),this.getAttributeManager().invalidateAll()}}draw({uniforms:e}){const{radiusUnits:t,radiusScale:i,radiusMinPixels:o,radiusMaxPixels:s,stroked:r,filled:a,billboard:l,antialiasing:c,lineWidthUnits:u,lineWidthScale:d,lineWidthMinPixels:g,lineWidthMaxPixels:f}=this.props;this.state.model.setUniforms(e).setUniforms({stroked:r?1:0,filled:a,billboard:l,antialiasing:c,radiusUnits:z[t],radiusScale:i,radiusMinPixels:o,radiusMaxPixels:s,lineWidthUnits:z[u],lineWidthScale:d,lineWidthMinPixels:g,lineWidthMaxPixels:f}).draw()}_getModel(e){const t=[-1,-1,0,1,-1,0,1,1,0,-1,1,0];return new O(e,{...this.getShaders(),id:this.props.id,geometry:new R({drawMode:6,vertexCount:4,attributes:{positions:{size:3,value:new Float32Array(t)}}}),isInstanced:!0})}}y(De,"defaultProps",jn);y(De,"layerName","ScatterplotLayer");const ke={CLOCKWISE:1,COUNTER_CLOCKWISE:-1};function Ne(n,e,t={}){return Hn(n,t)!==e?(Kn(n,t),!0):!1}function Hn(n,e={}){return Math.sign(Zn(n,e))}function Zn(n,e={}){const{start:t=0,end:i=n.length}=e,o=e.size||2;let s=0;for(let r=t,a=i-o;r<i;r+=o)s+=(n[r]-n[a])*(n[r+1]+n[a+1]),a=r;return s/2}function Kn(n,e){const{start:t=0,end:i=n.length,size:o=2}=e,s=(i-t)/o,r=Math.floor(s/2);for(let a=0;a<r;++a){const l=t+a*o,c=t+(s-1-a)*o;for(let u=0;u<o;++u){const d=n[l+u];n[l+u]=n[c+u],n[c+u]=d}}}function M(n,e){const t=e.length,i=n.length;if(i>0){let o=!0;for(let s=0;s<t;s++)if(n[i-t+s]!==e[s]){o=!1;break}if(o)return!1}for(let o=0;o<t;o++)n[i+o]=e[o];return!0}function Ee(n,e){const t=e.length;for(let i=0;i<t;i++)n[i]=e[i]}function X(n,e,t,i,o=[]){const s=i+e*t;for(let r=0;r<t;r++)o[r]=n[s+r];return o}function Ae(n,e,t,i,o=[]){let s,r;if(t&8)s=(i[3]-n[1])/(e[1]-n[1]),r=3;else if(t&4)s=(i[1]-n[1])/(e[1]-n[1]),r=1;else if(t&2)s=(i[2]-n[0])/(e[0]-n[0]),r=2;else if(t&1)s=(i[0]-n[0])/(e[0]-n[0]),r=0;else return null;for(let a=0;a<n.length;a++)o[a]=(r&1)===a?i[r]:s*(e[a]-n[a])+n[a];return o}function re(n,e){let t=0;return n[0]<e[0]?t|=1:n[0]>e[2]&&(t|=2),n[1]<e[1]?t|=4:n[1]>e[3]&&(t|=8),t}function Et(n,e){const{size:t=2,broken:i=!1,gridResolution:o=10,gridOffset:s=[0,0],startIndex:r=0,endIndex:a=n.length}=e||{},l=(a-r)/t;let c=[];const u=[c],d=X(n,0,t,r);let g,f;const p=Tt(d,o,s,[]),h=[];M(c,d);for(let v=1;v<l;v++){for(g=X(n,v,t,r,g),f=re(g,p);f;){Ae(d,g,f,p,h);const x=re(h,p);x&&(Ae(d,h,x,p,h),f=x),M(c,h),Ee(d,h),Jn(p,o,f),i&&c.length>t&&(c=[],u.push(c),M(c,d)),f=re(g,p)}M(c,g),Ee(d,g)}return i?u:u[0]}const Ye=0,Xn=1;function ee(n,e){for(let t=0;t<e.length;t++)n.push(e[t]);return n}function At(n,e=null,t){if(!n.length)return[];const{size:i=2,gridResolution:o=10,gridOffset:s=[0,0],edgeTypes:r=!1}=t||{},a=[],l=[{pos:n,types:r?new Array(n.length/i).fill(Xn):null,holes:e||[]}],c=[[],[]];let u=[];for(;l.length;){const{pos:d,types:g,holes:f}=l.shift();Yn(d,i,f[0]||d.length,c),u=Tt(c[0],o,s,u);const p=re(c[1],u);if(p){let h=$e(d,g,i,0,f[0]||d.length,u,p);const v={pos:h[0].pos,types:h[0].types,holes:[]},x={pos:h[1].pos,types:h[1].types,holes:[]};l.push(v,x);for(let _=0;_<f.length;_++)h=$e(d,g,i,f[_],f[_+1]||d.length,u,p),h[0]&&(v.holes.push(v.pos.length),v.pos=ee(v.pos,h[0].pos),r&&(v.types=ee(v.types,h[0].types))),h[1]&&(x.holes.push(x.pos.length),x.pos=ee(x.pos,h[1].pos),r&&(x.types=ee(x.types,h[1].types)))}else{const h={positions:d};r&&(h.edgeTypes=g),f.length&&(h.holeIndices=f),a.push(h)}}return a}function $e(n,e,t,i,o,s,r){const a=(o-i)/t,l=[],c=[],u=[],d=[],g=[];let f,p,h;const v=X(n,a-1,t,i);let x=Math.sign(r&8?v[1]-s[3]:v[0]-s[2]),_=e&&e[a-1],m=0,P=0;for(let C=0;C<a;C++)f=X(n,C,t,i,f),p=Math.sign(r&8?f[1]-s[3]:f[0]-s[2]),h=e&&e[i/t+C],p&&x&&x!==p&&(Ae(v,f,r,s,g),M(l,g)&&u.push(_),M(c,g)&&d.push(_)),p<=0?(M(l,f)&&u.push(h),m-=p):u.length&&(u[u.length-1]=Ye),p>=0?(M(c,f)&&d.push(h),P+=p):d.length&&(d[d.length-1]=Ye),Ee(v,f),x=p,_=h;return[m?{pos:l,types:e&&u}:null,P?{pos:c,types:e&&d}:null]}function Tt(n,e,t,i){const o=Math.floor((n[0]-t[0])/e)*e+t[0],s=Math.floor((n[1]-t[1])/e)*e+t[1];return i[0]=o,i[1]=s,i[2]=o+e,i[3]=s+e,i}function Jn(n,e,t){t&8?(n[1]+=e,n[3]+=e):t&4?(n[1]-=e,n[3]-=e):t&2?(n[0]+=e,n[2]+=e):t&1&&(n[0]-=e,n[2]-=e)}function Yn(n,e,t,i){let o=1/0,s=-1/0,r=1/0,a=-1/0;for(let l=0;l<t;l+=e){const c=n[l],u=n[l+1];o=c<o?c:o,s=c>s?c:s,r=u<r?u:r,a=u>a?u:a}return i[0][0]=o,i[0][1]=r,i[1][0]=s,i[1][1]=a,i}const $n=85.051129;function qn(n,e){const{size:t=2,startIndex:i=0,endIndex:o=n.length,normalize:s=!0}=e||{},r=n.slice(i,o);It(r,t,0,o-i);const a=Et(r,{size:t,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(s)for(const l of a)Mt(l,t);return a}function Qn(n,e=null,t){const{size:i=2,normalize:o=!0,edgeTypes:s=!1}=t||{};e=e||[];const r=[],a=[];let l=0,c=0;for(let d=0;d<=e.length;d++){const g=e[d]||n.length,f=c,p=ei(n,i,l,g);for(let h=p;h<g;h++)r[c++]=n[h];for(let h=l;h<p;h++)r[c++]=n[h];It(r,i,f,c),ti(r,i,f,c,t==null?void 0:t.maxLatitude),l=g,a[d]=c}a.pop();const u=At(r,a,{size:i,gridResolution:360,gridOffset:[-180,-180],edgeTypes:s});if(o)for(const d of u)Mt(d.positions,i);return u}function ei(n,e,t,i){let o=-1,s=-1;for(let r=t+1;r<i;r+=e){const a=Math.abs(n[r]);a>o&&(o=a,s=r-1)}return s}function ti(n,e,t,i,o=$n){const s=n[t],r=n[i-e];if(Math.abs(s-r)>180){const a=X(n,0,e,t);a[0]+=Math.round((r-s)/360)*360,M(n,a),a[1]=Math.sign(a[1])*o,M(n,a),a[0]=s,M(n,a)}}function It(n,e,t,i){let o=n[0],s;for(let r=t;r<i;r+=e){s=n[r];const a=s-o;(a>180||a<-180)&&(s-=Math.round(a/360)*360),n[r]=o=s}}function Mt(n,e){let t;const i=n.length/e;for(let s=0;s<i&&(t=n[s*e],(t+180)%360===0);s++);const o=-Math.round(t/360)*360;if(o!==0)for(let s=0;s<i;s++)n[s*e]+=o}class ni extends R{constructor(e){const{id:t=vt("column-geometry")}=e,{indices:i,attributes:o}=ii(e);super({...e,id:t,indices:i,attributes:o})}}function ii(n){const{radius:e,height:t=1,nradial:i=10}=n;let{vertices:o}=n;o&&(T.assert(o.length>=i),o=o.flatMap(f=>[f[0],f[1]]),Ne(o,ke.COUNTER_CLOCKWISE));const s=t>0,r=i+1,a=s?r*3+1:i,l=Math.PI*2/i,c=new Uint16Array(s?i*3*2:0),u=new Float32Array(a*3),d=new Float32Array(a*3);let g=0;if(s){for(let f=0;f<r;f++){const p=f*l,h=f%i,v=Math.sin(p),x=Math.cos(p);for(let _=0;_<2;_++)u[g+0]=o?o[h*2]:x*e,u[g+1]=o?o[h*2+1]:v*e,u[g+2]=(1/2-_)*t,d[g+0]=o?o[h*2]:x,d[g+1]=o?o[h*2+1]:v,g+=3}u[g+0]=u[g-3],u[g+1]=u[g-2],u[g+2]=u[g-1],g+=3}for(let f=s?0:1;f<r;f++){const p=Math.floor(f/2)*Math.sign(.5-f%2),h=p*l,v=(p+i)%i,x=Math.sin(h),_=Math.cos(h);u[g+0]=o?o[v*2]:_*e,u[g+1]=o?o[v*2+1]:x*e,u[g+2]=t/2,d[g+2]=1,g+=3}if(s){let f=0;for(let p=0;p<i;p++)c[f++]=p*2+0,c[f++]=p*2+2,c[f++]=p*2+0,c[f++]=p*2+1,c[f++]=p*2+1,c[f++]=p*2+3}return{indices:c,attributes:{POSITION:{size:3,value:u},NORMAL:{size:3,value:d}}}}const oi=`#version 300 es

#define SHADER_NAME column-layer-vertex-shader

in vec3 positions;
in vec3 normals;

in vec3 instancePositions;
in float instanceElevations;
in vec3 instancePositions64Low;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in float instanceStrokeWidths;

in vec3 instancePickingColors;
uniform float opacity;
uniform float radius;
uniform float angle;
uniform vec2 offset;
uniform bool extruded;
uniform bool stroked;
uniform bool isStroke;
uniform float coverage;
uniform float elevationScale;
uniform float edgeDistance;
uniform float widthScale;
uniform float widthMinPixels;
uniform float widthMaxPixels;
uniform int radiusUnits;
uniform int widthUnits;
out vec4 vColor;
#ifdef FLAT_SHADING
out vec4 position_commonspace;
#endif

void main(void) {
  geometry.worldPosition = instancePositions;

  vec4 color = isStroke ? instanceLineColors : instanceFillColors;
  mat2 rotationMatrix = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
  float elevation = 0.0;
  float strokeOffsetRatio = 1.0;

  if (extruded) {
    elevation = instanceElevations * (positions.z + 1.0) / 2.0 * elevationScale;
  } else if (stroked) {
    float widthPixels = clamp(
      project_size_to_pixel(instanceStrokeWidths * widthScale, widthUnits),
      widthMinPixels, widthMaxPixels) / 2.0;
    float halfOffset = project_pixel_size(widthPixels) / project_size(edgeDistance * coverage * radius);
    if (isStroke) {
      strokeOffsetRatio -= sign(positions.z) * halfOffset;
    } else {
      strokeOffsetRatio -= halfOffset;
    }
  }
  float shouldRender = float(color.a > 0.0 && instanceElevations >= 0.0);
  float dotRadius = radius * coverage * shouldRender;

  geometry.pickingColor = instancePickingColors;
  vec3 centroidPosition = vec3(instancePositions.xy, instancePositions.z + elevation);
  vec3 centroidPosition64Low = instancePositions64Low;
  vec2 offset = (rotationMatrix * positions.xy * strokeOffsetRatio + offset) * dotRadius;
  if (radiusUnits == UNIT_METERS) {
    offset = project_size(offset);
  }
  vec3 pos = vec3(offset, 0.);
  DECKGL_FILTER_SIZE(pos, geometry);

  gl_Position = project_position_to_clipspace(centroidPosition, centroidPosition64Low, pos, geometry.position);
  geometry.normal = project_normal(vec3(rotationMatrix * normals.xy, normals.z));
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  if (extruded && !isStroke) {
#ifdef FLAT_SHADING
    position_commonspace = geometry.position;
    vColor = vec4(color.rgb, color.a * opacity);
#else
    vec3 lightColor = lighting_getLightColor(color.rgb, project_uCameraPosition, geometry.position.xyz, geometry.normal);
    vColor = vec4(lightColor, color.a * opacity);
#endif
  } else {
    vColor = vec4(color.rgb, color.a * opacity);
  }
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`,si=`#version 300 es
#define SHADER_NAME column-layer-fragment-shader

precision highp float;

uniform vec3 project_uCameraPosition;
uniform bool extruded;
uniform bool isStroke;

out vec4 fragColor;

in vec4 vColor;
#ifdef FLAT_SHADING
in vec4 position_commonspace;
#endif

void main(void) {
  fragColor = vColor;
#ifdef FLAT_SHADING
  if (extruded && !isStroke && !picking_uActive) {
    vec3 normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
    fragColor.rgb = lighting_getLightColor(vColor.rgb, project_uCameraPosition, position_commonspace.xyz, normal);
  }
#endif
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,de=[0,0,0,255],ri={diskResolution:{type:"number",min:4,value:20},vertices:null,radius:{type:"number",min:0,value:1e3},angle:{type:"number",value:0},offset:{type:"array",value:[0,0]},coverage:{type:"number",min:0,max:1,value:1},elevationScale:{type:"number",min:0,value:1},radiusUnits:"meters",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,extruded:!0,wireframe:!1,filled:!0,stroked:!1,getPosition:{type:"accessor",value:n=>n.position},getFillColor:{type:"accessor",value:de},getLineColor:{type:"accessor",value:de},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0,getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class We extends F{getShaders(){const{gl:e}=this.context,t=!qt(e),i={},o=this.props.flatShading&&Qt(e,xt.GLSL_DERIVATIVES);return o&&(i.FLAT_SHADING=1),super.getShaders({vs:oi,fs:si,defines:i,transpileToGLSL100:t,modules:[D,o?en:Re,k]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceElevations:{size:1,transition:!0,accessor:"getElevation"},instanceFillColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:!0,accessor:"getFillColor",defaultValue:de},instanceLineColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:!0,accessor:"getLineColor",defaultValue:de},instanceStrokeWidths:{size:1,accessor:"getLineWidth",transition:!0}})}updateState(e){super.updateState(e);const{props:t,oldProps:i,changeFlags:o}=e,s=o.extensionsChanged||t.flatShading!==i.flatShading;if(s){var r;const{gl:a}=this.context;(r=this.state.model)===null||r===void 0||r.delete(),this.state.model=this._getModel(a),this.getAttributeManager().invalidateAll()}(s||t.diskResolution!==i.diskResolution||t.vertices!==i.vertices||(t.extruded||t.stroked)!==(i.extruded||i.stroked))&&this._updateGeometry(t)}getGeometry(e,t,i){const o=new ni({radius:1,height:i?2:0,vertices:t,nradial:e});let s=0;if(t)for(let r=0;r<e;r++){const a=t[r],l=Math.sqrt(a[0]*a[0]+a[1]*a[1]);s+=l/e}else s=1;return this.setState({edgeDistance:Math.cos(Math.PI/e)*s}),o}_getModel(e){return new O(e,{...this.getShaders(),id:this.props.id,isInstanced:!0})}_updateGeometry({diskResolution:e,vertices:t,extruded:i,stroked:o}){const s=this.getGeometry(e,t,i||o);this.setState({fillVertexCount:s.attributes.POSITION.value.length/3,wireframeVertexCount:s.indices.value.length}),this.state.model.setProps({geometry:s})}draw({uniforms:e}){const{lineWidthUnits:t,lineWidthScale:i,lineWidthMinPixels:o,lineWidthMaxPixels:s,radiusUnits:r,elevationScale:a,extruded:l,filled:c,stroked:u,wireframe:d,offset:g,coverage:f,radius:p,angle:h}=this.props,{model:v,fillVertexCount:x,wireframeVertexCount:_,edgeDistance:m}=this.state;v.setUniforms(e).setUniforms({radius:p,angle:h/180*Math.PI,offset:g,extruded:l,stroked:u,coverage:f,elevationScale:a,edgeDistance:m,radiusUnits:z[r],widthUnits:z[t],widthScale:i,widthMinPixels:o,widthMaxPixels:s}),l&&d&&(v.setProps({isIndexed:!0}),v.setVertexCount(_).setDrawMode(1).setUniforms({isStroke:!0}).draw()),c&&(v.setProps({isIndexed:!1}),v.setVertexCount(x).setDrawMode(5).setUniforms({isStroke:!1}).draw()),!l&&u&&(v.setProps({isIndexed:!1}),v.setVertexCount(x*2/3).setDrawMode(5).setUniforms({isStroke:!0}).draw())}}y(We,"layerName","ColumnLayer");y(We,"defaultProps",ri);const ai={cellSize:{type:"number",min:0,value:1e3},offset:{type:"array",value:[1,1]}};class zt extends We{getGeometry(e){return new cn}draw({uniforms:e}){const{elevationScale:t,extruded:i,offset:o,coverage:s,cellSize:r,angle:a,radiusUnits:l}=this.props;this.state.model.setUniforms(e).setUniforms({radius:r/2,radiusUnits:z[l],angle:a,offset:o,extruded:i,coverage:s,elevationScale:t,edgeDistance:1,isWireframe:!1}).draw()}}y(zt,"layerName","GridCellLayer");y(zt,"defaultProps",ai);function li(n,e,t,i){let o;if(Array.isArray(n[0])){const s=n.length*e;o=new Array(s);for(let r=0;r<n.length;r++)for(let a=0;a<e;a++)o[r*e+a]=n[r][a]||0}else o=n;return t?Et(o,{size:e,gridResolution:t}):i?qn(o,{size:e}):o}const ci=1,ui=2,_e=4;class di extends mt{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getGeometryFromBuffer(e){return this.normalize?super.getGeometryFromBuffer(e):null}normalizeGeometry(e){return this.normalize?li(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(qe(e)){let i=0;for(const o of e)i+=this.getGeometrySize(o);return i}const t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(t.geometrySize!==0)if(e&&qe(e))for(const i of e){const o=this.getGeometrySize(i);t.geometrySize=o,this.updateGeometryAttributes(i,t),t.vertexStart+=o}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){const i=this.attributes.segmentTypes,o=e?this.isClosed(e):!1,{vertexStart:s,geometrySize:r}=t;i.fill(0,s,s+r),o?(i[s]=_e,i[s+r-2]=_e):(i[s]+=ci,i[s+r-2]+=ui),i[s+r-1]=_e}_updatePositions(e,t){const{positions:i}=this.attributes;if(!i||!e)return;const{vertexStart:o,geometrySize:s}=t,r=new Array(3);for(let a=o,l=0;l<s;a++,l++)this.getPointOnPath(e,l,r),i[a*3]=r[0],i[a*3+1]=r[1],i[a*3+2]=r[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){const{positionSize:o}=this;t*o>=e.length&&(t+=1-e.length/o);const s=t*o;return i[0]=e[s],i[1]=e[s+1],i[2]=o===3&&e[s+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;const{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(t===2||e[2]===e[i+2])}}function qe(n){return Array.isArray(n[0])}const gi=`#define SHADER_NAME path-layer-vertex-shader

attribute vec2 positions;

attribute float instanceTypes;
attribute vec3 instanceStartPositions;
attribute vec3 instanceEndPositions;
attribute vec3 instanceLeftPositions;
attribute vec3 instanceRightPositions;
attribute vec3 instanceLeftPositions64Low;
attribute vec3 instanceStartPositions64Low;
attribute vec3 instanceEndPositions64Low;
attribute vec3 instanceRightPositions64Low;
attribute float instanceStrokeWidths;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;

uniform float widthScale;
uniform float widthMinPixels;
uniform float widthMaxPixels;
uniform float jointType;
uniform float capType;
uniform float miterLimit;
uniform bool billboard;
uniform int widthUnits;

uniform float opacity;

varying vec4 vColor;
varying vec2 vCornerOffset;
varying float vMiterLength;
varying vec2 vPathPosition;
varying float vPathLength;
varying float vJointType;

const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);

float flipIfTrue(bool flag) {
  return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
  vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
  vec2 width
) {
  bool isEnd = positions.x > 0.0;
  float sideOfPath = positions.y;
  float isJoint = float(sideOfPath == 0.0);

  vec3 deltaA3 = (currPoint - prevPoint);
  vec3 deltaB3 = (nextPoint - currPoint);

  mat3 rotationMatrix;
  bool needsRotation = !billboard && project_needs_rotation(currPoint, rotationMatrix);
  if (needsRotation) {
    deltaA3 = deltaA3 * rotationMatrix;
    deltaB3 = deltaB3 * rotationMatrix;
  }
  vec2 deltaA = deltaA3.xy / width;
  vec2 deltaB = deltaB3.xy / width;

  float lenA = length(deltaA);
  float lenB = length(deltaB);

  vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);
  vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);

  vec2 perpA = vec2(-dirA.y, dirA.x);
  vec2 perpB = vec2(-dirB.y, dirB.x);
  vec2 tangent = dirA + dirB;
  tangent = length(tangent) > 0. ? normalize(tangent) : perpA;
  vec2 miterVec = vec2(-tangent.y, tangent.x);
  vec2 dir = isEnd ? dirA : dirB;
  vec2 perp = isEnd ? perpA : perpB;
  float L = isEnd ? lenA : lenB;
  float sinHalfA = abs(dot(miterVec, perp));
  float cosHalfA = abs(dot(dirA, miterVec));
  float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
  float cornerPosition = sideOfPath * turnDirection;

  float miterSize = 1.0 / max(sinHalfA, EPSILON);
  miterSize = mix(
    min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
    miterSize,
    step(0.0, cornerPosition)
  );

  vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))
    * (sideOfPath + isJoint * turnDirection);
  bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
  bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
  bool isCap = isStartCap || isEndCap;
  if (isCap) {
    offsetVec = mix(perp * sideOfPath, dir * capType * 4.0 * flipIfTrue(isStartCap), isJoint);
    vJointType = capType;
  } else {
    vJointType = jointType;
  }
  vPathLength = L;
  vCornerOffset = offsetVec;
  vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
  vMiterLength = isCap ? isJoint : vMiterLength;

  vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
  vPathPosition = vec2(
    dot(offsetFromStartOfPath, perp),
    dot(offsetFromStartOfPath, dir)
  );
  geometry.uv = vPathPosition;

  float isValid = step(instanceTypes, 3.5);
  vec3 offset = vec3(offsetVec * width * isValid, 0.0);

  if (needsRotation) {
    offset = rotationMatrix * offset;
  }
  return offset;
}
void clipLine(inout vec4 position, vec4 refPosition) {
  if (position.w < EPSILON) {
    float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
    position = refPosition + (position - refPosition) * r;
  }
}

void main() {
  geometry.pickingColor = instancePickingColors;

  vColor = vec4(instanceColors.rgb, instanceColors.a * opacity);

  float isEnd = positions.x;

  vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);
  vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);

  vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);
  vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);

  vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);
  vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);

  geometry.worldPosition = currPosition;
  vec2 widthPixels = vec2(clamp(
    project_size_to_pixel(instanceStrokeWidths * widthScale, widthUnits),
    widthMinPixels, widthMaxPixels) / 2.0);
  vec3 width;

  if (billboard) {
    vec4 prevPositionScreen = project_position_to_clipspace(prevPosition, prevPosition64Low, ZERO_OFFSET);
    vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
    vec4 nextPositionScreen = project_position_to_clipspace(nextPosition, nextPosition64Low, ZERO_OFFSET);

    clipLine(prevPositionScreen, currPositionScreen);
    clipLine(nextPositionScreen, currPositionScreen);
    clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));

    width = vec3(widthPixels, 0.0);
    DECKGL_FILTER_SIZE(width, geometry);

    vec3 offset = getLineJoinOffset(
      prevPositionScreen.xyz / prevPositionScreen.w,
      currPositionScreen.xyz / currPositionScreen.w,
      nextPositionScreen.xyz / nextPositionScreen.w,
      project_pixel_size_to_clipspace(width.xy)
    );

    DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
    gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
  } else {
    prevPosition = project_position(prevPosition, prevPosition64Low);
    currPosition = project_position(currPosition, currPosition64Low);
    nextPosition = project_position(nextPosition, nextPosition64Low);

    width = vec3(project_pixel_size(widthPixels), 0.0);
    DECKGL_FILTER_SIZE(width, geometry);

    vec3 offset = getLineJoinOffset(prevPosition, currPosition, nextPosition, width.xy);
    geometry.position = vec4(currPosition + offset, 1.0);
    gl_Position = project_common_position_to_clipspace(geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  }
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`,fi=`#define SHADER_NAME path-layer-fragment-shader

precision highp float;

uniform float miterLimit;

varying vec4 vColor;
varying vec2 vCornerOffset;
varying float vMiterLength;
varying vec2 vPathPosition;
varying float vPathLength;
varying float vJointType;

void main(void) {
  geometry.uv = vPathPosition;

  if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
    if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
      discard;
    }
    if (vJointType < 0.5 && vMiterLength > miterLimit + 1.0) {
      discard;
    }
  }
  gl_FragColor = vColor;

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,Ot=[0,0,0,255],pi={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},billboard:!1,_pathType:null,getPath:{type:"accessor",value:n=>n.path},getColor:{type:"accessor",value:Ot},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},Ce={enter:(n,e)=>e.length?e.subarray(e.length-n.length):n};class he extends F{constructor(...e){super(...e),y(this,"state",void 0)}getShaders(){return super.getShaders({vs:gi,fs:fi,modules:[D,k]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({positions:{size:3,vertexOffset:1,type:5130,fp64:this.use64bitPositions(),transition:Ce,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}},instanceTypes:{size:1,type:5121,update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:Ce,defaultValue:1},instanceColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,accessor:"getColor",transition:Ce,defaultValue:Ot},instancePickingColors:{size:3,type:5121,accessor:(i,{index:o,target:s})=>this.encodePickingColor(i&&i.__source?i.__source.index:o,s)}}),this.setState({pathTesselator:new di({fp64:this.use64bitPositions()})})}updateState(e){super.updateState(e);const{props:t,changeFlags:i}=e,o=this.getAttributeManager();if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPath)){const{pathTesselator:a}=this.state,l=t.data.attributes||{};a.updateGeometry({data:t.data,geometryBuffer:l.getPath,buffers:l,normalize:!t._pathType,loop:t._pathType==="loop",getGeometry:t.getPath,positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude,resolution:this.context.viewport.resolution,dataChanged:i.dataChanged}),this.setState({numInstances:a.instanceCount,startIndices:a.vertexStarts}),i.dataChanged||o.invalidateAll()}if(i.extensionsChanged){var r;const{gl:a}=this.context;(r=this.state.model)===null||r===void 0||r.delete(),this.state.model=this._getModel(a),o.invalidateAll()}}getPickingInfo(e){const t=super.getPickingInfo(e),{index:i}=t,{data:o}=this.props;return o[0]&&o[0].__source&&(t.object=o.find(s=>s.__source.index===i)),t}disablePickingIndex(e){const{data:t}=this.props;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){const{jointRounded:t,capRounded:i,billboard:o,miterLimit:s,widthUnits:r,widthScale:a,widthMinPixels:l,widthMaxPixels:c}=this.props;this.state.model.setUniforms(e).setUniforms({jointType:Number(t),capType:Number(i),billboard:o,widthUnits:z[r],widthScale:a,miterLimit:s,widthMinPixels:l,widthMaxPixels:c}).draw()}_getModel(e){const t=[0,1,2,1,4,2,1,3,4,3,5,4],i=[0,0,0,-1,0,1,1,-1,1,1,1,0];return new O(e,{...this.getShaders(),id:this.props.id,geometry:new R({drawMode:4,attributes:{indices:new Uint16Array(t),positions:{value:new Float32Array(i),size:2}}}),isInstanced:!0})}calculatePositions(e){const{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){const{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}}y(he,"defaultProps",pi);y(he,"layerName","PathLayer");var Ue={exports:{}};Ue.exports=ve;Ue.exports.default=ve;function ve(n,e,t){t=t||2;var i=e&&e.length,o=i?e[0]*t:n.length,s=Rt(n,0,o,t,!0),r=[];if(!s||s.next===s.prev)return r;var a,l,c,u,d,g,f;if(i&&(s=mi(n,e,s,t)),n.length>80*t){a=c=n[0],l=u=n[1];for(var p=t;p<o;p+=t)d=n[p],g=n[p+1],d<a&&(a=d),g<l&&(l=g),d>c&&(c=d),g>u&&(u=g);f=Math.max(c-a,u-l),f=f!==0?32767/f:0}return J(s,r,t,a,l,f,0),r}function Rt(n,e,t,i,o){var s,r;if(o===Me(n,e,t,i)>0)for(s=e;s<t;s+=i)r=Qe(s,n[s],n[s+1],r);else for(s=t-i;s>=e;s-=i)r=Qe(s,n[s],n[s+1],r);return r&&ye(r,r.next)&&($(r),r=r.next),r}function W(n,e){if(!n)return n;e||(e=n);var t=n,i;do if(i=!1,!t.steiner&&(ye(t,t.next)||L(t.prev,t,t.next)===0)){if($(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function J(n,e,t,i,o,s,r){if(n){!r&&s&&Si(n,i,o,s);for(var a=n,l,c;n.prev!==n.next;){if(l=n.prev,c=n.next,s?vi(n,i,o,s):hi(n)){e.push(l.i/t|0),e.push(n.i/t|0),e.push(c.i/t|0),$(n),n=c.next,a=c.next;continue}if(n=c,n===a){r?r===1?(n=yi(W(n),e,t),J(n,e,t,i,o,s,2)):r===2&&xi(n,e,t,i,o,s):J(W(n),e,t,i,o,s,1);break}}}}function hi(n){var e=n.prev,t=n,i=n.next;if(L(e,t,i)>=0)return!1;for(var o=e.x,s=t.x,r=i.x,a=e.y,l=t.y,c=i.y,u=o<s?o<r?o:r:s<r?s:r,d=a<l?a<c?a:c:l<c?l:c,g=o>s?o>r?o:r:s>r?s:r,f=a>l?a>c?a:c:l>c?l:c,p=i.next;p!==e;){if(p.x>=u&&p.x<=g&&p.y>=d&&p.y<=f&&G(o,a,s,l,r,c,p.x,p.y)&&L(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function vi(n,e,t,i){var o=n.prev,s=n,r=n.next;if(L(o,s,r)>=0)return!1;for(var a=o.x,l=s.x,c=r.x,u=o.y,d=s.y,g=r.y,f=a<l?a<c?a:c:l<c?l:c,p=u<d?u<g?u:g:d<g?d:g,h=a>l?a>c?a:c:l>c?l:c,v=u>d?u>g?u:g:d>g?d:g,x=Te(f,p,e,t,i),_=Te(h,v,e,t,i),m=n.prevZ,P=n.nextZ;m&&m.z>=x&&P&&P.z<=_;){if(m.x>=f&&m.x<=h&&m.y>=p&&m.y<=v&&m!==o&&m!==r&&G(a,u,l,d,c,g,m.x,m.y)&&L(m.prev,m,m.next)>=0||(m=m.prevZ,P.x>=f&&P.x<=h&&P.y>=p&&P.y<=v&&P!==o&&P!==r&&G(a,u,l,d,c,g,P.x,P.y)&&L(P.prev,P,P.next)>=0))return!1;P=P.nextZ}for(;m&&m.z>=x;){if(m.x>=f&&m.x<=h&&m.y>=p&&m.y<=v&&m!==o&&m!==r&&G(a,u,l,d,c,g,m.x,m.y)&&L(m.prev,m,m.next)>=0)return!1;m=m.prevZ}for(;P&&P.z<=_;){if(P.x>=f&&P.x<=h&&P.y>=p&&P.y<=v&&P!==o&&P!==r&&G(a,u,l,d,c,g,P.x,P.y)&&L(P.prev,P,P.next)>=0)return!1;P=P.nextZ}return!0}function yi(n,e,t){var i=n;do{var o=i.prev,s=i.next.next;!ye(o,s)&&Ft(o,i,i.next,s)&&Y(o,s)&&Y(s,o)&&(e.push(o.i/t|0),e.push(i.i/t|0),e.push(s.i/t|0),$(i),$(i.next),i=n=s),i=i.next}while(i!==n);return W(i)}function xi(n,e,t,i,o,s){var r=n;do{for(var a=r.next.next;a!==r.prev;){if(r.i!==a.i&&Ei(r,a)){var l=Dt(r,a);r=W(r,r.next),l=W(l,l.next),J(r,e,t,i,o,s,0),J(l,e,t,i,o,s,0);return}a=a.next}r=r.next}while(r!==n)}function mi(n,e,t,i){var o=[],s,r,a,l,c;for(s=0,r=e.length;s<r;s++)a=e[s]*i,l=s<r-1?e[s+1]*i:n.length,c=Rt(n,a,l,i,!1),c===c.next&&(c.steiner=!0),o.push(bi(c));for(o.sort(Pi),s=0;s<o.length;s++)t=_i(o[s],t);return t}function Pi(n,e){return n.x-e.x}function _i(n,e){var t=Ci(n,e);if(!t)return e;var i=Dt(t,n);return W(i,i.next),W(t,t.next)}function Ci(n,e){var t=e,i=n.x,o=n.y,s=-1/0,r;do{if(o<=t.y&&o>=t.next.y&&t.next.y!==t.y){var a=t.x+(o-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(a<=i&&a>s&&(s=a,r=t.x<t.next.x?t:t.next,a===i))return r}t=t.next}while(t!==e);if(!r)return null;var l=r,c=r.x,u=r.y,d=1/0,g;t=r;do i>=t.x&&t.x>=c&&i!==t.x&&G(o<u?i:s,o,c,u,o<u?s:i,o,t.x,t.y)&&(g=Math.abs(o-t.y)/(i-t.x),Y(t,n)&&(g<d||g===d&&(t.x>r.x||t.x===r.x&&Li(r,t)))&&(r=t,d=g)),t=t.next;while(t!==l);return r}function Li(n,e){return L(n.prev,n,e.prev)<0&&L(e.next,n,n.next)<0}function Si(n,e,t,i){var o=n;do o.z===0&&(o.z=Te(o.x,o.y,e,t,i)),o.prevZ=o.prev,o.nextZ=o.next,o=o.next;while(o!==n);o.prevZ.nextZ=null,o.prevZ=null,wi(o)}function wi(n){var e,t,i,o,s,r,a,l,c=1;do{for(t=n,n=null,s=null,r=0;t;){for(r++,i=t,a=0,e=0;e<c&&(a++,i=i.nextZ,!!i);e++);for(l=c;a>0||l>0&&i;)a!==0&&(l===0||!i||t.z<=i.z)?(o=t,t=t.nextZ,a--):(o=i,i=i.nextZ,l--),s?s.nextZ=o:n=o,o.prevZ=s,s=o;t=i}s.nextZ=null,c*=2}while(r>1);return n}function Te(n,e,t,i,o){return n=(n-t)*o|0,e=(e-i)*o|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function bi(n){var e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function G(n,e,t,i,o,s,r,a){return(o-r)*(e-a)>=(n-r)*(s-a)&&(n-r)*(i-a)>=(t-r)*(e-a)&&(t-r)*(s-a)>=(o-r)*(i-a)}function Ei(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!Ai(n,e)&&(Y(n,e)&&Y(e,n)&&Ti(n,e)&&(L(n.prev,n,e.prev)||L(n,e.prev,e))||ye(n,e)&&L(n.prev,n,n.next)>0&&L(e.prev,e,e.next)>0)}function L(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function ye(n,e){return n.x===e.x&&n.y===e.y}function Ft(n,e,t,i){var o=ne(L(n,e,t)),s=ne(L(n,e,i)),r=ne(L(t,i,n)),a=ne(L(t,i,e));return!!(o!==s&&r!==a||o===0&&te(n,t,e)||s===0&&te(n,i,e)||r===0&&te(t,n,i)||a===0&&te(t,e,i))}function te(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function ne(n){return n>0?1:n<0?-1:0}function Ai(n,e){var t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&Ft(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function Y(n,e){return L(n.prev,n,n.next)<0?L(n,e,n.next)>=0&&L(n,n.prev,e)>=0:L(n,e,n.prev)<0||L(n,n.next,e)<0}function Ti(n,e){var t=n,i=!1,o=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&o<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Dt(n,e){var t=new Ie(n.i,n.x,n.y),i=new Ie(e.i,e.x,e.y),o=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=o,o.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Qe(n,e,t,i){var o=new Ie(n,e,t);return i?(o.next=i.next,o.prev=i,i.next.prev=o,i.next=o):(o.prev=o,o.next=o),o}function $(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Ie(n,e,t){this.i=n,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}ve.deviation=function(n,e,t,i){var o=e&&e.length,s=o?e[0]*t:n.length,r=Math.abs(Me(n,0,s,t));if(o)for(var a=0,l=e.length;a<l;a++){var c=e[a]*t,u=a<l-1?e[a+1]*t:n.length;r-=Math.abs(Me(n,c,u,t))}var d=0;for(a=0;a<i.length;a+=3){var g=i[a]*t,f=i[a+1]*t,p=i[a+2]*t;d+=Math.abs((n[g]-n[p])*(n[f+1]-n[g+1])-(n[g]-n[f])*(n[p+1]-n[g+1]))}return r===0&&d===0?0:Math.abs((d-r)/r)};function Me(n,e,t,i){for(var o=0,s=e,r=t-i;s<t;s+=i)o+=(n[r]-n[s])*(n[s+1]+n[r+1]),r=s;return o}ve.flatten=function(n){for(var e=n[0][0].length,t={vertices:[],holes:[],dimensions:e},i=0,o=0;o<n.length;o++){for(var s=0;s<n[o].length;s++)for(var r=0;r<e;r++)t.vertices.push(n[o][s][r]);o>0&&(i+=n[o-1].length,t.holes.push(i))}return t};var Ii=Ue.exports;const Mi=nn(Ii),ie=ke.CLOCKWISE,et=ke.COUNTER_CLOCKWISE,N={isClosed:!0};function zi(n){if(n=n&&n.positions||n,!Array.isArray(n)&&!ArrayBuffer.isView(n))throw new Error("invalid polygon")}function j(n){return"positions"in n?n.positions:n}function ae(n){return"holeIndices"in n?n.holeIndices:null}function Oi(n){return Array.isArray(n[0])}function Ri(n){return n.length>=1&&n[0].length>=2&&Number.isFinite(n[0][0])}function Fi(n){const e=n[0],t=n[n.length-1];return e[0]===t[0]&&e[1]===t[1]&&e[2]===t[2]}function Di(n,e,t,i){for(let o=0;o<e;o++)if(n[t+o]!==n[i-e+o])return!1;return!0}function tt(n,e,t,i,o){let s=e;const r=t.length;for(let a=0;a<r;a++)for(let l=0;l<i;l++)n[s++]=t[a][l]||0;if(!Fi(t))for(let a=0;a<i;a++)n[s++]=t[0][a]||0;return N.start=e,N.end=s,N.size=i,Ne(n,o,N),s}function nt(n,e,t,i,o=0,s,r){s=s||t.length;const a=s-o;if(a<=0)return e;let l=e;for(let c=0;c<a;c++)n[l++]=t[o+c];if(!Di(t,i,o,s))for(let c=0;c<i;c++)n[l++]=t[o+c];return N.start=e,N.end=l,N.size=i,Ne(n,r,N),l}function kt(n,e){zi(n);const t=[],i=[];if("positions"in n){const{positions:o,holeIndices:s}=n;if(s){let r=0;for(let a=0;a<=s.length;a++)r=nt(t,r,o,e,s[a-1],s[a],a===0?ie:et),i.push(r);return i.pop(),{positions:t,holeIndices:i}}n=o}if(!Oi(n))return nt(t,0,n,e,0,t.length,ie),t;if(!Ri(n)){let o=0;for(const[s,r]of n.entries())o=tt(t,o,r,e,s===0?ie:et),i.push(o);return i.pop(),{positions:t,holeIndices:i}}return tt(t,0,n,e,ie),t}function Le(n,e,t){const i=n.length/3;let o=0;for(let s=0;s<i;s++){const r=(s+1)%i;o+=n[s*3+e]*n[r*3+t],o-=n[r*3+e]*n[s*3+t]}return Math.abs(o/2)}function it(n,e,t,i){const o=n.length/3;for(let s=0;s<o;s++){const r=s*3,a=n[r+0],l=n[r+1],c=n[r+2];n[r+e]=a,n[r+t]=l,n[r+i]=c}}function ki(n,e,t,i){let o=ae(n);o&&(o=o.map(a=>a/e));let s=j(n);const r=i&&e===3;if(t){const a=s.length;s=s.slice();const l=[];for(let c=0;c<a;c+=e){l[0]=s[c],l[1]=s[c+1],r&&(l[2]=s[c+2]);const u=t(l);s[c]=u[0],s[c+1]=u[1],r&&(s[c+2]=u[2])}}if(r){const a=Le(s,0,1),l=Le(s,0,2),c=Le(s,1,2);if(!a&&!l&&!c)return[];a>l&&a>c||(l>c?(t||(s=s.slice()),it(s,0,2,1)):(t||(s=s.slice()),it(s,2,0,1)))}return Mi(s,o,e)}class Ni extends mt{constructor(e){const{fp64:t,IndexType:i=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint8ClampedArray,size:1},indices:{type:i,size:1}}})}get(e){const{attributes:t}=this;return e==="indices"?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);const t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw new Error("missing indices buffer")}normalizeGeometry(e){if(this.normalize){const t=kt(e,this.positionSize);return this.opts.resolution?At(j(t),ae(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?Qn(j(t),ae(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return e}getGeometrySize(e){if(ot(e)){let t=0;for(const i of e)t+=this.getGeometrySize(i);return t}return j(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&ot(e))for(const i of e){const o=this.getGeometrySize(i);t.geometrySize=o,this.updateGeometryAttributes(i,t),t.vertexStart+=o,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:i,indexStart:o}){const{attributes:s,indexStarts:r,typedArrayManager:a}=this;let l=s.indices;if(!l||!e)return;let c=o;const u=ki(e,this.positionSize,this.opts.preproject,this.opts.full3d);l=a.allocate(l,o+u.length,{copy:!0});for(let d=0;d<u.length;d++)l[c++]=u[d]+i;r[t+1]=o+u.length,s.indices=l}_updatePositions(e,{vertexStart:t,geometrySize:i}){const{attributes:{positions:o},positionSize:s}=this;if(!o||!e)return;const r=j(e);for(let a=t,l=0;l<i;a++,l++){const c=r[l*s],u=r[l*s+1],d=s>2?r[l*s+2]:0;o[a*3]=c,o[a*3+1]=u,o[a*3+2]=d}}_updateVertexValid(e,{vertexStart:t,geometrySize:i}){const{positionSize:o}=this,s=this.attributes.vertexValid,r=e&&ae(e);if(e&&e.edgeTypes?s.set(e.edgeTypes,t):s.fill(1,t,t+i),r)for(let a=0;a<r.length;a++)s[t+r[a]/o-1]=0;s[t+i-1]=0}}function ot(n){return Array.isArray(n)&&n.length>0&&!Number.isFinite(n[0])}const Nt=`
attribute vec2 vertexPositions;
attribute float vertexValid;

uniform bool extruded;
uniform bool isWireframe;
uniform float elevationScale;
uniform float opacity;

varying vec4 vColor;

struct PolygonProps {
  vec4 fillColors;
  vec4 lineColors;
  vec3 positions;
  vec3 nextPositions;
  vec3 pickingColors;
  vec3 positions64Low;
  vec3 nextPositions64Low;
  float elevations;
};

vec3 project_offset_normal(vec3 vector) {
  if (project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
    project_uCoordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
    return normalize(vector * project_uCommonUnitsPerWorldUnit);
  }
  return project_normal(vector);
}

void calculatePosition(PolygonProps props) {
#ifdef IS_SIDE_VERTEX
  if(vertexValid < 0.5){
    gl_Position = vec4(0.);
    return;
  }
#endif

  vec3 pos;
  vec3 pos64Low;
  vec3 normal;
  vec4 colors = isWireframe ? props.lineColors : props.fillColors;

  geometry.worldPosition = props.positions;
  geometry.worldPositionAlt = props.nextPositions;
  geometry.pickingColor = props.pickingColors;

#ifdef IS_SIDE_VERTEX
  pos = mix(props.positions, props.nextPositions, vertexPositions.x);
  pos64Low = mix(props.positions64Low, props.nextPositions64Low, vertexPositions.x);
#else
  pos = props.positions;
  pos64Low = props.positions64Low;
#endif

  if (extruded) {
    pos.z += props.elevations * vertexPositions.y * elevationScale;
  }
  gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);

  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  if (extruded) {
  #ifdef IS_SIDE_VERTEX
    normal = vec3(
      props.positions.y - props.nextPositions.y + (props.positions64Low.y - props.nextPositions64Low.y),
      props.nextPositions.x - props.positions.x + (props.nextPositions64Low.x - props.positions64Low.x),
      0.0);
    normal = project_offset_normal(normal);
  #else
    normal = project_normal(vec3(0.0, 0.0, 1.0));
  #endif
    geometry.normal = normal;
    vec3 lightColor = lighting_getLightColor(colors.rgb, project_uCameraPosition, geometry.position.xyz, normal);
    vColor = vec4(lightColor, colors.a * opacity);
  } else {
    vColor = vec4(colors.rgb, colors.a * opacity);
  }
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`,Wi=`#define SHADER_NAME solid-polygon-layer-vertex-shader

attribute vec3 positions;
attribute vec3 positions64Low;
attribute float elevations;
attribute vec4 fillColors;
attribute vec4 lineColors;
attribute vec3 pickingColors;

`.concat(Nt,`

void main(void) {
  PolygonProps props;

  props.positions = positions;
  props.positions64Low = positions64Low;
  props.elevations = elevations;
  props.fillColors = fillColors;
  props.lineColors = lineColors;
  props.pickingColors = pickingColors;

  calculatePosition(props);
}
`),Ui=`#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX


attribute vec3 instancePositions;
attribute vec3 nextPositions;
attribute vec3 instancePositions64Low;
attribute vec3 nextPositions64Low;
attribute float instanceElevations;
attribute vec4 instanceFillColors;
attribute vec4 instanceLineColors;
attribute vec3 instancePickingColors;

`.concat(Nt,`

void main(void) {
  PolygonProps props;

  #if RING_WINDING_ORDER_CW == 1
    props.positions = instancePositions;
    props.positions64Low = instancePositions64Low;
    props.nextPositions = nextPositions;
    props.nextPositions64Low = nextPositions64Low;
  #else
    props.positions = nextPositions;
    props.positions64Low = nextPositions64Low;
    props.nextPositions = instancePositions;
    props.nextPositions64Low = instancePositions64Low;
  #endif
  props.elevations = instanceElevations;
  props.fillColors = instanceFillColors;
  props.lineColors = instanceLineColors;
  props.pickingColors = instancePickingColors;

  calculatePosition(props);
}
`),Gi=`#define SHADER_NAME solid-polygon-layer-fragment-shader

precision highp float;

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,ge=[0,0,0,255],Bi={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:n=>n.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:ge},getLineColor:{type:"accessor",value:ge},material:!0},oe={enter:(n,e)=>e.length?e.subarray(e.length-n.length):n};class xe extends F{constructor(...e){super(...e),y(this,"state",void 0)}getShaders(e){return super.getShaders({vs:e==="top"?Wi:Ui,fs:Gi,defines:{RING_WINDING_ORDER_CW:!this.props._normalize&&this.props._windingOrder==="CCW"?0:1},modules:[D,Re,k]})}get wrapLongitude(){return!1}initializeState(){const{gl:e,viewport:t}=this.context;let{coordinateSystem:i}=this.props;const{_full3d:o}=this.props;t.isGeospatial&&i===H.DEFAULT&&(i=H.LNGLAT);let s;i===H.LNGLAT&&(o?s=t.projectPosition.bind(t):s=t.projectFlat.bind(t)),this.setState({numInstances:0,polygonTesselator:new Ni({preproject:s,fp64:this.use64bitPositions(),IndexType:!e||tn(e,xt.ELEMENT_INDEX_UINT32)?Uint32Array:Uint16Array})});const r=this.getAttributeManager(),a=!0;r.remove(["instancePickingColors"]),r.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:a},positions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:oe,accessor:"getPolygon",update:this.calculatePositions,noAlloc:a,shaderAttributes:{positions:{vertexOffset:0,divisor:0},instancePositions:{vertexOffset:0,divisor:1},nextPositions:{vertexOffset:1,divisor:1}}},vertexValid:{size:1,divisor:1,type:5121,update:this.calculateVertexValid,noAlloc:a},elevations:{size:1,transition:oe,accessor:"getElevation",shaderAttributes:{elevations:{divisor:0},instanceElevations:{divisor:1}}},fillColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:oe,accessor:"getFillColor",defaultValue:ge,shaderAttributes:{fillColors:{divisor:0},instanceFillColors:{divisor:1}}},lineColors:{size:this.props.colorFormat.length,type:5121,normalized:!0,transition:oe,accessor:"getLineColor",defaultValue:ge,shaderAttributes:{lineColors:{divisor:0},instanceLineColors:{divisor:1}}},pickingColors:{size:3,type:5121,accessor:(l,{index:c,target:u})=>this.encodePickingColor(l&&l.__source?l.__source.index:c,u),shaderAttributes:{pickingColors:{divisor:0},instancePickingColors:{divisor:1}}}})}getPickingInfo(e){const t=super.getPickingInfo(e),{index:i}=t,{data:o}=this.props;return o[0]&&o[0].__source&&(t.object=o.find(s=>s.__source.index===i)),t}disablePickingIndex(e){const{data:t}=this.props;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){const{extruded:t,filled:i,wireframe:o,elevationScale:s}=this.props,{topModel:r,sideModel:a,polygonTesselator:l}=this.state,c={...e,extruded:!!t,elevationScale:s};a&&(a.setInstanceCount(l.instanceCount-1),a.setUniforms(c),o&&(a.setDrawMode(3),a.setUniforms({isWireframe:!0}).draw()),i&&(a.setDrawMode(6),a.setUniforms({isWireframe:!1}).draw())),r&&(r.setVertexCount(l.vertexCount),r.setUniforms(c).draw())}updateState(e){super.updateState(e),this.updateGeometry(e);const{props:t,oldProps:i,changeFlags:o}=e,s=this.getAttributeManager();if(o.extensionsChanged||t.filled!==i.filled||t.extruded!==i.extruded){var a;(a=this.state.models)===null||a===void 0||a.forEach(l=>l.delete()),this.setState(this._getModels(this.context.gl)),s.invalidateAll()}}updateGeometry({props:e,oldProps:t,changeFlags:i}){if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){const{polygonTesselator:s}=this.state,r=e.data.attributes||{};s.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:r.getPolygon,buffers:r,getGeometry:e.getPolygon,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:i.dataChanged,full3d:e._full3d}),this.setState({numInstances:s.instanceCount,startIndices:s.vertexStarts}),i.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(e){const{id:t,filled:i,extruded:o}=this.props;let s,r;if(i){const a=this.getShaders("top");a.defines.NON_INSTANCED_MODEL=1,s=new O(e,{...a,id:"".concat(t,"-top"),drawMode:4,attributes:{vertexPositions:new Float32Array([0,1])},uniforms:{isWireframe:!1,isSideVertex:!1},vertexCount:0,isIndexed:!0})}return o&&(r=new O(e,{...this.getShaders("side"),id:"".concat(t,"-side"),geometry:new R({drawMode:1,vertexCount:4,attributes:{vertexPositions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),instanceCount:0,isInstanced:1}),r.userData.excludeAttributes={indices:!0}),{models:[r,s].filter(Boolean),topModel:s,sideModel:r}}calculateIndices(e){const{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){const{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateVertexValid(e){e.value=this.state.polygonTesselator.get("vertexValid")}}y(xe,"defaultProps",Bi);y(xe,"layerName","SolidPolygonLayer");function Wt({data:n,getIndex:e,dataRange:t,replace:i}){const{startRow:o=0,endRow:s=1/0}=t,r=n.length;let a=r,l=r;for(let g=0;g<r;g++){const f=e(n[g]);if(a>g&&f>=o&&(a=g),f>=s){l=g;break}}let c=a;const d=l-a!==i.length?n.slice(l):void 0;for(let g=0;g<i.length;g++)n[c++]=i[g];if(d){for(let g=0;g<d.length;g++)n[c++]=d[g];n.length=c}return{startRow:a,endRow:a+i.length}}const Ut=[0,0,0,255],Vi=[0,0,0,255],ji={stroked:!0,filled:!0,extruded:!1,elevationScale:1,wireframe:!1,_normalize:!0,_windingOrder:"CW",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,lineJointRounded:!1,lineMiterLimit:4,getPolygon:{type:"accessor",value:n=>n.polygon},getFillColor:{type:"accessor",value:Vi},getLineColor:{type:"accessor",value:Ut},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0};class Gt extends Fe{initializeState(){this.state={paths:[]},this.props.getLineDashArray&&T.removed("getLineDashArray","PathStyleExtension")()}updateState({changeFlags:e}){const t=e.dataChanged||e.updateTriggersChanged&&(e.updateTriggersChanged.all||e.updateTriggersChanged.getPolygon);if(t&&Array.isArray(e.dataChanged)){const i=this.state.paths.slice(),o=e.dataChanged.map(s=>Wt({data:i,getIndex:r=>r.__source.index,dataRange:s,replace:this._getPaths(s)}));this.setState({paths:i,pathsDiff:o})}else t&&this.setState({paths:this._getPaths(),pathsDiff:null})}_getPaths(e={}){const{data:t,getPolygon:i,positionFormat:o,_normalize:s}=this.props,r=[],a=o==="XY"?2:3,{startRow:l,endRow:c}=e,{iterable:u,objectInfo:d}=Oe(t,l,c);for(const g of u){d.index++;let f=i(g,d);s&&(f=kt(f,a));const{holeIndices:p}=f,h=f.positions||f;if(p)for(let v=0;v<=p.length;v++){const x=h.slice(p[v-1]||0,p[v]||h.length);r.push(this.getSubLayerRow({path:x},g,d.index))}else r.push(this.getSubLayerRow({path:h},g,d.index))}return r}renderLayers(){const{data:e,_dataDiff:t,stroked:i,filled:o,extruded:s,wireframe:r,_normalize:a,_windingOrder:l,elevationScale:c,transitions:u,positionFormat:d}=this.props,{lineWidthUnits:g,lineWidthScale:f,lineWidthMinPixels:p,lineWidthMaxPixels:h,lineJointRounded:v,lineMiterLimit:x,lineDashJustified:_}=this.props,{getFillColor:m,getLineColor:P,getLineWidth:C,getLineDashArray:E,getElevation:A,getPolygon:I,updateTriggers:S,material:q}=this.props,{paths:U,pathsDiff:b}=this.state,w=this.getSubLayerClass("fill",xe),me=this.getSubLayerClass("stroke",he),Q=this.shouldRenderSubLayer("fill",U)&&new w({_dataDiff:t,extruded:s,elevationScale:c,filled:o,wireframe:r,_normalize:a,_windingOrder:l,getElevation:A,getFillColor:m,getLineColor:s&&r?P:Ut,material:q,transitions:u},this.getSubLayerProps({id:"fill",updateTriggers:S&&{getPolygon:S.getPolygon,getElevation:S.getElevation,getFillColor:S.getFillColor,lineColors:s&&r,getLineColor:S.getLineColor}}),{data:e,positionFormat:d,getPolygon:I}),Xt=!s&&i&&this.shouldRenderSubLayer("stroke",U)&&new me({_dataDiff:b&&(()=>b),widthUnits:g,widthScale:f,widthMinPixels:p,widthMaxPixels:h,jointRounded:v,miterLimit:x,dashJustified:_,_pathType:"loop",transitions:u&&{getWidth:u.getLineWidth,getColor:u.getLineColor,getPath:u.getPolygon},getColor:this.getSubLayerAccessor(P),getWidth:this.getSubLayerAccessor(C),getDashArray:this.getSubLayerAccessor(E)},this.getSubLayerProps({id:"stroke",updateTriggers:S&&{getWidth:S.getLineWidth,getColor:S.getLineColor,getDashArray:S.getLineDashArray}}),{data:U,positionFormat:d,getPath:Jt=>Jt.path});return[!s&&Q,Xt,s&&Q]}}y(Gt,"layerName","PolygonLayer");y(Gt,"defaultProps",ji);function Hi(n,e){if(!n)return null;const t="startIndices"in n?n.startIndices[e]:e,i=n.featureIds.value[t];return t!==-1?Zi(n,i,t):null}function Zi(n,e,t){const i={properties:{...n.properties[e]}};for(const o in n.numericProps)i.properties[o]=n.numericProps[o].value[t];return i}function Ki(n,e){const t={points:null,lines:null,polygons:null};for(const i in t){const o=n[i].globalFeatureIds.value;t[i]=new Uint8ClampedArray(o.length*3);const s=[];for(let r=0;r<o.length;r++)e(o[r],s),t[i][r*3+0]=s[0],t[i][r*3+1]=s[1],t[i][r*3+2]=s[2]}return t}const Xi=`#define SHADER_NAME multi-icon-layer-fragment-shader

precision highp float;

uniform float opacity;
uniform sampler2D iconsTexture;
uniform float gamma;
uniform bool sdf;
uniform float alphaCutoff;
uniform float sdfBuffer;
uniform float outlineBuffer;
uniform vec4 outlineColor;

varying vec4 vColor;
varying vec2 vTextureCoords;
varying vec2 uv;

void main(void) {
  geometry.uv = uv;

  if (!picking_uActive) {
    float alpha = texture2D(iconsTexture, vTextureCoords).a;
    vec4 color = vColor;
    if (sdf) {
      float distance = alpha;
      alpha = smoothstep(sdfBuffer - gamma, sdfBuffer + gamma, distance);

      if (outlineBuffer > 0.0) {
        float inFill = alpha;
        float inBorder = smoothstep(outlineBuffer - gamma, outlineBuffer + gamma, distance);
        color = mix(outlineColor, vColor, inFill);
        alpha = inBorder;
      }
    }
    float a = alpha * color.a;
    
    if (a < alphaCutoff) {
      discard;
    }

    gl_FragColor = vec4(color.rgb, a * opacity);
  }

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,Se=192/256,st=[],Ji={getIconOffsets:{type:"accessor",value:n=>n.offsets},alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]}};class Ge extends pe{constructor(...e){super(...e),y(this,"state",void 0)}getShaders(){return{...super.getShaders(),fs:Xi}}initializeState(){super.initializeState(),this.getAttributeManager().addInstanced({instanceOffsets:{size:2,accessor:"getIconOffsets"},instancePickingColors:{type:5121,size:3,accessor:(t,{index:i,target:o})=>this.encodePickingColor(i,o)}})}updateState(e){super.updateState(e);const{props:t,oldProps:i}=e;let{outlineColor:o}=t;o!==i.outlineColor&&(o=o.map(s=>s/255),o[3]=Number.isFinite(o[3])?o[3]:1,this.setState({outlineColor:o})),!t.sdf&&t.outlineWidth&&T.warn("".concat(this.id,": fontSettings.sdf is required to render outline"))()}draw(e){const{sdf:t,smoothing:i,outlineWidth:o}=this.props,{outlineColor:s}=this.state,r=o?Math.max(i,Se*(1-o)):-1;if(e.uniforms={...e.uniforms,sdfBuffer:Se,outlineBuffer:r,gamma:i,sdf:!!t,outlineColor:s},super.draw(e),t&&o){const{iconManager:a}=this.state;a.getTexture()&&this.state.model.draw({uniforms:{outlineBuffer:Se}})}}getInstanceOffset(e){return e?Array.from(e).flatMap(t=>super.getInstanceOffset(t)):st}getInstanceColorMode(e){return 1}getInstanceIconFrame(e){return e?Array.from(e).flatMap(t=>super.getInstanceIconFrame(t)):st}}y(Ge,"defaultProps",Ji);y(Ge,"layerName","MultiIconLayer");const Z=1e20;class Yi{constructor({fontSize:e=24,buffer:t=3,radius:i=8,cutoff:o=.25,fontFamily:s="sans-serif",fontWeight:r="normal",fontStyle:a="normal"}={}){this.buffer=t,this.cutoff=o,this.radius=i;const l=this.size=e+t*4,c=this._createCanvas(l),u=this.ctx=c.getContext("2d",{willReadFrequently:!0});u.font=`${a} ${r} ${e}px ${s}`,u.textBaseline="alphabetic",u.textAlign="left",u.fillStyle="black",this.gridOuter=new Float64Array(l*l),this.gridInner=new Float64Array(l*l),this.f=new Float64Array(l),this.z=new Float64Array(l+1),this.v=new Uint16Array(l)}_createCanvas(e){const t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){const{width:t,actualBoundingBoxAscent:i,actualBoundingBoxDescent:o,actualBoundingBoxLeft:s,actualBoundingBoxRight:r}=this.ctx.measureText(e),a=Math.ceil(i),l=0,c=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(r-s))),u=Math.min(this.size-this.buffer,a+Math.ceil(o)),d=c+2*this.buffer,g=u+2*this.buffer,f=Math.max(d*g,0),p=new Uint8ClampedArray(f),h={data:p,width:d,height:g,glyphWidth:c,glyphHeight:u,glyphTop:a,glyphLeft:l,glyphAdvance:t};if(c===0||u===0)return h;const{ctx:v,buffer:x,gridInner:_,gridOuter:m}=this;v.clearRect(x,x,c,u),v.fillText(e,x,x+a);const P=v.getImageData(x,x,c,u);m.fill(Z,0,f),_.fill(0,0,f);for(let C=0;C<u;C++)for(let E=0;E<c;E++){const A=P.data[4*(C*c+E)+3]/255;if(A===0)continue;const I=(C+x)*d+E+x;if(A===1)m[I]=0,_[I]=Z;else{const S=.5-A;m[I]=S>0?S*S:0,_[I]=S<0?S*S:0}}rt(m,0,0,d,g,d,this.f,this.v,this.z),rt(_,x,x,c,u,d,this.f,this.v,this.z);for(let C=0;C<f;C++){const E=Math.sqrt(m[C])-Math.sqrt(_[C]);p[C]=Math.round(255-255*(E/this.radius+this.cutoff))}return h}}function rt(n,e,t,i,o,s,r,a,l){for(let c=e;c<e+i;c++)at(n,t*s+c,s,o,r,a,l);for(let c=t;c<t+o;c++)at(n,c*s+e,1,i,r,a,l)}function at(n,e,t,i,o,s,r){s[0]=0,r[0]=-Z,r[1]=Z,o[0]=n[e];for(let a=1,l=0,c=0;a<i;a++){o[a]=n[e+a*t];const u=a*a;do{const d=s[l];c=(o[a]-o[d]+u-d*d)/(a-d)/2}while(c<=r[l]&&--l>-1);l++,s[l]=a,r[l]=c,r[l+1]=Z}for(let a=0,l=0;a<i;a++){for(;r[l+1]<a;)l++;const c=s[l],u=a-c;n[e+a*t]=o[c]+u*u}}const $i=32,qi=[];function Qi(n){return Math.pow(2,Math.ceil(Math.log2(n)))}function eo({characterSet:n,getFontWidth:e,fontHeight:t,buffer:i,maxCanvasWidth:o,mapping:s={},xOffset:r=0,yOffset:a=0}){let l=0,c=r;const u=t+i*2;for(const d of n)if(!s[d]){const g=e(d);c+g+i*2>o&&(c=0,l++),s[d]={x:c+i,y:a+l*u+i,width:g,height:u,layoutWidth:g,layoutHeight:t},c+=g+i*2}return{mapping:s,xOffset:c,yOffset:a+l*u,canvasHeight:Qi(a+(l+1)*u)}}function Bt(n,e,t,i){let o=0;for(let r=e;r<t;r++){var s;const a=n[r];o+=((s=i[a])===null||s===void 0?void 0:s.layoutWidth)||0}return o}function Vt(n,e,t,i,o,s){let r=e,a=0;for(let l=e;l<t;l++){const c=Bt(n,l,l+1,o);a+c>i&&(r<l&&s.push(l),r=l,a=0),a+=c}return a}function to(n,e,t,i,o,s){let r=e,a=e,l=e,c=0;for(let u=e;u<t;u++)if((n[u]===" "||n[u+1]===" "||u+1===t)&&(l=u+1),l>a){let d=Bt(n,a,l,o);c+d>i&&(r<a&&(s.push(a),r=a,c=0),d>i&&(d=Vt(n,a,l,i,o,s),r=s[s.length-1])),a=l,c+=d}return c}function no(n,e,t,i,o=0,s){s===void 0&&(s=n.length);const r=[];return e==="break-all"?Vt(n,o,s,t,i,r):to(n,o,s,t,i,r),r}function io(n,e,t,i,o,s){let r=0,a=0;for(let l=e;l<t;l++){const c=n[l],u=i[c];u?(a||(a=u.layoutHeight),o[l]=r+u.layoutWidth/2,r+=u.layoutWidth):(T.warn("Missing character: ".concat(c," (").concat(c.codePointAt(0),")"))(),o[l]=r,r+=$i)}s[0]=r,s[1]=a}function oo(n,e,t,i,o){const s=Array.from(n),r=s.length,a=new Array(r),l=new Array(r),c=new Array(r),u=(t==="break-word"||t==="break-all")&&isFinite(i)&&i>0,d=[0,0],g=[0,0];let f=0,p=0,h=0;for(let x=0;x<=r;x++){const _=s[x];if((_===`
`||x===r)&&(h=x),h>p){const m=u?no(s,t,i,o,p,h):qi;for(let P=0;P<=m.length;P++){const C=P===0?p:m[P-1],E=P<m.length?m[P]:h;io(s,C,E,o,a,g);for(let A=C;A<E;A++){var v;const I=s[A],S=((v=o[I])===null||v===void 0?void 0:v.layoutOffsetY)||0;l[A]=f+g[1]/2+S,c[A]=g[0]}f=f+g[1]*e,d[0]=Math.max(d[0],g[0])}p=h}_===`
`&&(a[p]=0,l[p]=0,c[p]=0,p++)}return d[1]=f,{x:a,y:l,rowWidth:c,size:d}}function so({value:n,length:e,stride:t,offset:i,startIndices:o,characterSet:s}){const r=n.BYTES_PER_ELEMENT,a=t?t/r:1,l=i?i/r:0,c=o[e]||Math.ceil((n.length-l)/a),u=s&&new Set,d=new Array(e);let g=n;if(a>1||l>0){const f=n.constructor;g=new f(c);for(let p=0;p<c;p++)g[p]=n[p*a+l]}for(let f=0;f<e;f++){const p=o[f],h=o[f+1]||c,v=g.subarray(p,h);d[f]=String.fromCodePoint.apply(null,v),u&&v.forEach(u.add,u)}if(u)for(const f of u)s.add(String.fromCodePoint(f));return{texts:d,characterCount:c}}class jt{constructor(e=5){y(this,"limit",void 0),y(this,"_cache",{}),y(this,"_order",[]),this.limit=e}get(e){const t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?(this.delete(e),this._cache[e]=t,this._appendOrder(e)):(Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e))}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){const t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}function ro(){const n=[];for(let e=32;e<128;e++)n.push(String.fromCharCode(e));return n}const B={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:ro(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},lt=1024,ct=.9,ut=1.2,Ht=3;let fe=new jt(Ht);function ao(n,e){let t;typeof e=="string"?t=new Set(Array.from(e)):t=new Set(e);const i=fe.get(n);if(!i)return t;for(const o in i.mapping)t.has(o)&&t.delete(o);return t}function lo(n,e){for(let t=0;t<n.length;t++)e.data[4*t+3]=n[t]}function dt(n,e,t,i){n.font="".concat(i," ").concat(t,"px ").concat(e),n.fillStyle="#000",n.textBaseline="alphabetic",n.textAlign="left"}function co(n){T.assert(Number.isFinite(n)&&n>=Ht,"Invalid cache limit"),fe=new jt(n)}class uo{constructor(){y(this,"props",{...B}),y(this,"_key",void 0),y(this,"_atlas",void 0)}get texture(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}get scale(){const{fontSize:e,buffer:t}=this.props;return(e*ut+t*2)/e}setProps(e={}){Object.assign(this.props,e),this._key=this._getKey();const t=ao(this._key,this.props.characterSet),i=fe.get(this._key);if(i&&t.size===0){this._atlas!==i&&(this._atlas=i);return}const o=this._generateFontAtlas(t,i);this._atlas=o,fe.set(this._key,o)}_generateFontAtlas(e,t){const{fontFamily:i,fontWeight:o,fontSize:s,buffer:r,sdf:a,radius:l,cutoff:c}=this.props;let u=t&&t.data;u||(u=document.createElement("canvas"),u.width=lt);const d=u.getContext("2d",{willReadFrequently:!0});dt(d,i,s,o);const{mapping:g,canvasHeight:f,xOffset:p,yOffset:h}=eo({getFontWidth:v=>d.measureText(v).width,fontHeight:s*ut,buffer:r,characterSet:e,maxCanvasWidth:lt,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffset:t.yOffset}});if(u.height!==f){const v=d.getImageData(0,0,u.width,u.height);u.height=f,d.putImageData(v,0,0)}if(dt(d,i,s,o),a){const v=new Yi({fontSize:s,buffer:r,radius:l,cutoff:c,fontFamily:i,fontWeight:"".concat(o)});for(const x of e){const{data:_,width:m,height:P,glyphTop:C}=v.draw(x);g[x].width=m,g[x].layoutOffsetY=s*ct-C;const E=d.createImageData(m,P);lo(_,E),d.putImageData(E,g[x].x,g[x].y)}}else for(const v of e)d.fillText(v,g[v].x,g[v].y+r+s*ct);return{xOffset:p,yOffset:h,mapping:g,data:u,width:u.width,height:u.height}}_getKey(){const{fontFamily:e,fontWeight:t,fontSize:i,buffer:o,sdf:s,radius:r,cutoff:a}=this.props;return s?"".concat(e," ").concat(t," ").concat(i," ").concat(o," ").concat(r," ").concat(a):"".concat(e," ").concat(t," ").concat(i," ").concat(o)}}const go=`#define SHADER_NAME text-background-layer-vertex-shader

attribute vec2 positions;

attribute vec3 instancePositions;
attribute vec3 instancePositions64Low;
attribute vec4 instanceRects;
attribute float instanceSizes;
attribute float instanceAngles;
attribute vec2 instancePixelOffsets;
attribute float instanceLineWidths;
attribute vec4 instanceFillColors;
attribute vec4 instanceLineColors;
attribute vec3 instancePickingColors;

uniform bool billboard;
uniform float opacity;
uniform float sizeScale;
uniform float sizeMinPixels;
uniform float sizeMaxPixels;
uniform vec4 padding;
uniform int sizeUnits;

varying vec4 vFillColor;
varying vec4 vLineColor;
varying float vLineWidth;
varying vec2 uv;
varying vec2 dimensions;

vec2 rotate_by_angle(vec2 vertex, float angle) {
  float angle_radian = radians(angle);
  float cos_angle = cos(angle_radian);
  float sin_angle = sin(angle_radian);
  mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
  return rotationMatrix * vertex;
}

void main(void) {
  geometry.worldPosition = instancePositions;
  geometry.uv = positions;
  geometry.pickingColor = instancePickingColors;
  uv = positions;
  vLineWidth = instanceLineWidths;
  float sizePixels = clamp(
    project_size_to_pixel(instanceSizes * sizeScale, sizeUnits),
    sizeMinPixels, sizeMaxPixels
  );

  dimensions = instanceRects.zw * sizePixels + padding.xy + padding.zw;

  vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * sizePixels + mix(-padding.xy, padding.zw, positions);
  pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);
  pixelOffset += instancePixelOffsets;
  pixelOffset.y *= -1.0;

  if (billboard)  {
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
    vec3 offset = vec3(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(offset, geometry);
    gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
  } else {
    vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
    DECKGL_FILTER_SIZE(offset_common, geometry);
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  }
  vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * opacity);
  DECKGL_FILTER_COLOR(vFillColor, geometry);
  vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * opacity);
  DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,fo=`#define SHADER_NAME text-background-layer-fragment-shader

precision highp float;

uniform bool stroked;

varying vec4 vFillColor;
varying vec4 vLineColor;
varying float vLineWidth;
varying vec2 uv;
varying vec2 dimensions;

void main(void) {
  geometry.uv = uv;

  vec2 pixelPosition = uv * dimensions;
  if (stroked) {
    float distToEdge = min(
      min(pixelPosition.x, dimensions.x - pixelPosition.x),
      min(pixelPosition.y, dimensions.y - pixelPosition.y)
    );
    float isBorder = smoothedge(distToEdge, vLineWidth);
    gl_FragColor = mix(vFillColor, vLineColor, isBorder);
  } else {
    gl_FragColor = vFillColor;
  }

  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`,po={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:n=>n.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class Be extends F{constructor(...e){super(...e),y(this,"state",void 0)}getShaders(){return super.getShaders({vs:go,fs:fo,modules:[D,k]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:5130,fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instanceRects:{size:4,accessor:"getBoundingRect"},instancePixelOffsets:{size:2,transition:!0,accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,normalized:!0,type:5121,accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,normalized:!0,type:5121,accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);const{changeFlags:t}=e;if(t.extensionsChanged){var i;const{gl:o}=this.context;(i=this.state.model)===null||i===void 0||i.delete(),this.state.model=this._getModel(o),this.getAttributeManager().invalidateAll()}}draw({uniforms:e}){const{billboard:t,sizeScale:i,sizeUnits:o,sizeMinPixels:s,sizeMaxPixels:r,getLineWidth:a}=this.props;let{padding:l}=this.props;l.length<4&&(l=[l[0],l[1],l[0],l[1]]),this.state.model.setUniforms(e).setUniforms({billboard:t,stroked:!!a,padding:l,sizeUnits:z[o],sizeScale:i,sizeMinPixels:s,sizeMaxPixels:r}).draw()}_getModel(e){const t=[0,0,1,0,1,1,0,1];return new O(e,{...this.getShaders(),id:this.props.id,geometry:new R({drawMode:6,vertexCount:4,attributes:{positions:{size:2,value:new Float32Array(t)}}}),isInstanced:!0})}}y(Be,"defaultProps",po);y(Be,"layerName","TextBackgroundLayer");const gt={start:1,middle:0,end:-1},ft={top:1,center:0,bottom:-1},we=[0,0,0,255],ho=1,vo={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:we},getBorderWidth:{type:"accessor",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:B.characterSet},fontFamily:B.fontFamily,fontWeight:B.fontWeight,lineHeight:ho,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:we},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},getText:{type:"accessor",value:n=>n.text},getPosition:{type:"accessor",value:n=>n.position},getColor:{type:"accessor",value:we},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class Ve extends Fe{constructor(...e){super(...e),y(this,"state",void 0),y(this,"getBoundingRect",(t,i)=>{let{size:[o,s]}=this.transformParagraph(t,i);const{fontSize:r}=this.state.fontAtlasManager.props;o/=r,s/=r;const{getTextAnchor:a,getAlignmentBaseline:l}=this.props,c=gt[typeof a=="function"?a(t,i):a],u=ft[typeof l=="function"?l(t,i):l];return[(c-1)*o/2,(u-1)*s/2,o,s]}),y(this,"getIconOffsets",(t,i)=>{const{getTextAnchor:o,getAlignmentBaseline:s}=this.props,{x:r,y:a,rowWidth:l,size:[c,u]}=this.transformParagraph(t,i),d=gt[typeof o=="function"?o(t,i):o],g=ft[typeof s=="function"?s(t,i):s],f=r.length,p=new Array(f*2);let h=0;for(let v=0;v<f;v++){const x=(1-d)*(c-l[v])/2;p[h++]=(d-1)*c/2+x+r[v],p[h++]=(g-1)*u/2+a[v]}return p})}initializeState(){this.state={styleVersion:0,fontAtlasManager:new uo},this.props.maxWidth>0&&T.warn("v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){const{props:t,oldProps:i,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){const{fontSettings:e,fontFamily:t,fontWeight:i}=this.props,{fontAtlasManager:o,characterSet:s}=this.state,r={...e,characterSet:s,fontFamily:t,fontWeight:i};if(!o.mapping)return o.setProps(r),!0;for(const a in r)if(r[a]!==o.props[a])return o.setProps(r),!0;return!1}_updateText(){var e;const{data:t,characterSet:i}=this.props,o=(e=t.attributes)===null||e===void 0?void 0:e.getText;let{getText:s}=this.props,r=t.startIndices,a;const l=i==="auto"&&new Set;if(o&&r){const{texts:c,characterCount:u}=so({...ArrayBuffer.isView(o)?{value:o}:o,length:t.length,startIndices:r,characterSet:l});a=u,s=(d,{index:g})=>c[g]}else{const{iterable:c,objectInfo:u}=Oe(t);r=[0],a=0;for(const d of c){u.index++;const g=Array.from(s(d,u)||"");l&&g.forEach(l.add,l),a+=g.length,r.push(a)}}this.setState({getText:s,startIndices:r,numInstances:a,characterSet:l||i})}transformParagraph(e,t){const{fontAtlasManager:i}=this.state,o=i.mapping,s=this.state.getText,{wordBreak:r,lineHeight:a,maxWidth:l}=this.props,c=s(e,t)||"";return oo(c,a,r,l*i.props.fontSize,o)}renderLayers(){const{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{scale:o,texture:s,mapping:r},styleVersion:a}=this.state,{data:l,_dataDiff:c,getPosition:u,getColor:d,getSize:g,getAngle:f,getPixelOffset:p,getBackgroundColor:h,getBorderColor:v,getBorderWidth:x,backgroundPadding:_,background:m,billboard:P,fontSettings:C,outlineWidth:E,outlineColor:A,sizeScale:I,sizeUnits:S,sizeMinPixels:q,sizeMaxPixels:U,transitions:b,updateTriggers:w}=this.props,me=this.getSubLayerClass("characters",Ge),Q=this.getSubLayerClass("background",Be);return[m&&new Q({getFillColor:h,getLineColor:v,getLineWidth:x,padding:_,getPosition:u,getSize:g,getAngle:f,getPixelOffset:p,billboard:P,sizeScale:I,sizeUnits:S,sizeMinPixels:q,sizeMaxPixels:U,transitions:b&&{getPosition:b.getPosition,getAngle:b.getAngle,getSize:b.getSize,getFillColor:b.getBackgroundColor,getLineColor:b.getBorderColor,getLineWidth:b.getBorderWidth,getPixelOffset:b.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:w.getPosition,getAngle:w.getAngle,getSize:w.getSize,getFillColor:w.getBackgroundColor,getLineColor:w.getBorderColor,getLineWidth:w.getBorderWidth,getPixelOffset:w.getPixelOffset,getBoundingRect:{getText:w.getText,getTextAnchor:w.getTextAnchor,getAlignmentBaseline:w.getAlignmentBaseline,styleVersion:a}}}),{data:l.attributes&&l.attributes.background?{length:l.length,attributes:l.attributes.background}:l,_dataDiff:c,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new me({sdf:C.sdf,smoothing:Number.isFinite(C.smoothing)?C.smoothing:B.smoothing,outlineWidth:E/(C.radius||B.radius),outlineColor:A,iconAtlas:s,iconMapping:r,getPosition:u,getColor:d,getSize:g,getAngle:f,getPixelOffset:p,billboard:P,sizeScale:I*o,sizeUnits:S,sizeMinPixels:q*o,sizeMaxPixels:U*o,transitions:b&&{getPosition:b.getPosition,getAngle:b.getAngle,getColor:b.getColor,getSize:b.getSize,getPixelOffset:b.getPixelOffset}},this.getSubLayerProps({id:"characters",updateTriggers:{all:w.getText,getPosition:w.getPosition,getAngle:w.getAngle,getColor:w.getColor,getSize:w.getSize,getPixelOffset:w.getPixelOffset,getIconOffsets:{getTextAnchor:w.getTextAnchor,getAlignmentBaseline:w.getAlignmentBaseline,styleVersion:a}}}),{data:l,_dataDiff:c,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){co(e)}}y(Ve,"defaultProps",vo);y(Ve,"layerName","TextLayer");const le={circle:{type:De,props:{filled:"filled",stroked:"stroked",lineWidthMaxPixels:"lineWidthMaxPixels",lineWidthMinPixels:"lineWidthMinPixels",lineWidthScale:"lineWidthScale",lineWidthUnits:"lineWidthUnits",pointRadiusMaxPixels:"radiusMaxPixels",pointRadiusMinPixels:"radiusMinPixels",pointRadiusScale:"radiusScale",pointRadiusUnits:"radiusUnits",pointAntialiasing:"antialiasing",pointBillboard:"billboard",getFillColor:"getFillColor",getLineColor:"getLineColor",getLineWidth:"getLineWidth",getPointRadius:"getRadius"}},icon:{type:pe,props:{iconAtlas:"iconAtlas",iconMapping:"iconMapping",iconSizeMaxPixels:"sizeMaxPixels",iconSizeMinPixels:"sizeMinPixels",iconSizeScale:"sizeScale",iconSizeUnits:"sizeUnits",iconAlphaCutoff:"alphaCutoff",iconBillboard:"billboard",getIcon:"getIcon",getIconAngle:"getAngle",getIconColor:"getColor",getIconPixelOffset:"getPixelOffset",getIconSize:"getSize"}},text:{type:Ve,props:{textSizeMaxPixels:"sizeMaxPixels",textSizeMinPixels:"sizeMinPixels",textSizeScale:"sizeScale",textSizeUnits:"sizeUnits",textBackground:"background",textBackgroundPadding:"backgroundPadding",textFontFamily:"fontFamily",textFontWeight:"fontWeight",textLineHeight:"lineHeight",textMaxWidth:"maxWidth",textOutlineColor:"outlineColor",textOutlineWidth:"outlineWidth",textWordBreak:"wordBreak",textCharacterSet:"characterSet",textBillboard:"billboard",textFontSettings:"fontSettings",getText:"getText",getTextAngle:"getAngle",getTextColor:"getColor",getTextPixelOffset:"getPixelOffset",getTextSize:"getSize",getTextAnchor:"getTextAnchor",getTextAlignmentBaseline:"getAlignmentBaseline",getTextBackgroundColor:"getBackgroundColor",getTextBorderColor:"getBorderColor",getTextBorderWidth:"getBorderWidth"}}},ce={type:he,props:{lineWidthUnits:"widthUnits",lineWidthScale:"widthScale",lineWidthMinPixels:"widthMinPixels",lineWidthMaxPixels:"widthMaxPixels",lineJointRounded:"jointRounded",lineCapRounded:"capRounded",lineMiterLimit:"miterLimit",lineBillboard:"billboard",getLineColor:"getColor",getLineWidth:"getWidth"}},ze={type:xe,props:{extruded:"extruded",filled:"filled",wireframe:"wireframe",elevationScale:"elevationScale",material:"material",_full3d:"_full3d",getElevation:"getElevation",getFillColor:"getFillColor",getLineColor:"getLineColor"}};function V({type:n,props:e}){const t={};for(const i in e)t[i]=n.defaultProps[e[i]];return t}function be(n,e){const{transitions:t,updateTriggers:i}=n.props,o={updateTriggers:{},transitions:t&&{getPosition:t.geometry}};for(const s in e){const r=e[s];let a=n.props[s];s.startsWith("get")&&(a=n.getSubLayerAccessor(a),o.updateTriggers[r]=i[s],t&&(o.transitions[r]=t[s])),o[r]=a}return o}function yo(n){if(Array.isArray(n))return n;switch(T.assert(n.type,"GeoJSON does not have type"),n.type){case"Feature":return[n];case"FeatureCollection":return T.assert(Array.isArray(n.features),"GeoJSON does not have features array"),n.features;default:return[{geometry:n}]}}function pt(n,e,t={}){const i={pointFeatures:[],lineFeatures:[],polygonFeatures:[],polygonOutlineFeatures:[]},{startRow:o=0,endRow:s=n.length}=t;for(let r=o;r<s;r++){const a=n[r],{geometry:l}=a;if(l)if(l.type==="GeometryCollection"){T.assert(Array.isArray(l.geometries),"GeoJSON does not have geometries array");const{geometries:c}=l;for(let u=0;u<c.length;u++){const d=c[u];ht(d,i,e,a,r)}}else ht(l,i,e,a,r)}return i}function ht(n,e,t,i,o){const{type:s,coordinates:r}=n,{pointFeatures:a,lineFeatures:l,polygonFeatures:c,polygonOutlineFeatures:u}=e;if(!mo(s,r)){T.warn("".concat(s," coordinates are malformed"))();return}switch(s){case"Point":a.push(t({geometry:n},i,o));break;case"MultiPoint":r.forEach(d=>{a.push(t({geometry:{type:"Point",coordinates:d}},i,o))});break;case"LineString":l.push(t({geometry:n},i,o));break;case"MultiLineString":r.forEach(d=>{l.push(t({geometry:{type:"LineString",coordinates:d}},i,o))});break;case"Polygon":c.push(t({geometry:n},i,o)),r.forEach(d=>{u.push(t({geometry:{type:"LineString",coordinates:d}},i,o))});break;case"MultiPolygon":r.forEach(d=>{c.push(t({geometry:{type:"Polygon",coordinates:d}},i,o)),d.forEach(g=>{u.push(t({geometry:{type:"LineString",coordinates:g}},i,o))})});break}}const xo={Point:1,MultiPoint:2,LineString:2,MultiLineString:3,Polygon:3,MultiPolygon:4};function mo(n,e){let t=xo[n];for(T.assert(t,"Unknown GeoJSON type ".concat(n));e&&--t>0;)e=e[0];return e&&Number.isFinite(e[0])}function Zt(){return{points:{},lines:{},polygons:{},polygonsOutline:{}}}function se(n){return n.geometry.coordinates}function Po(n,e){const t=Zt(),{pointFeatures:i,lineFeatures:o,polygonFeatures:s,polygonOutlineFeatures:r}=n;return t.points.data=i,t.points._dataDiff=e.pointFeatures&&(()=>e.pointFeatures),t.points.getPosition=se,t.lines.data=o,t.lines._dataDiff=e.lineFeatures&&(()=>e.lineFeatures),t.lines.getPath=se,t.polygons.data=s,t.polygons._dataDiff=e.polygonFeatures&&(()=>e.polygonFeatures),t.polygons.getPolygon=se,t.polygonsOutline.data=r,t.polygonsOutline._dataDiff=e.polygonOutlineFeatures&&(()=>e.polygonOutlineFeatures),t.polygonsOutline.getPath=se,t}function _o(n,e){const t=Zt(),{points:i,lines:o,polygons:s}=n,r=Ki(n,e);return t.points.data={length:i.positions.value.length/i.positions.size,attributes:{...i.attributes,getPosition:i.positions,instancePickingColors:{size:3,value:r.points}},properties:i.properties,numericProps:i.numericProps,featureIds:i.featureIds},t.lines.data={length:o.pathIndices.value.length-1,startIndices:o.pathIndices.value,attributes:{...o.attributes,getPath:o.positions,instancePickingColors:{size:3,value:r.lines}},properties:o.properties,numericProps:o.numericProps,featureIds:o.featureIds},t.lines._pathType="open",t.polygons.data={length:s.polygonIndices.value.length-1,startIndices:s.polygonIndices.value,attributes:{...s.attributes,getPolygon:s.positions,pickingColors:{size:3,value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},t.polygons._normalize=!1,s.triangles&&(t.polygons.data.attributes.indices=s.triangles.value),t.polygonsOutline.data={length:s.primitivePolygonIndices.value.length-1,startIndices:s.primitivePolygonIndices.value,attributes:{...s.attributes,getPath:s.positions,instancePickingColors:{size:3,value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},t.polygonsOutline._pathType="open",t}const Co=["points","linestrings","polygons"],Lo={...V(le.circle),...V(le.icon),...V(le.text),...V(ce),...V(ze),stroked:!0,filled:!0,extruded:!1,wireframe:!1,_full3d:!1,iconAtlas:{type:"object",value:null},iconMapping:{type:"object",value:{}},getIcon:{type:"accessor",value:n=>n.properties.icon},getText:{type:"accessor",value:n=>n.properties.text},pointType:"circle",getRadius:{deprecatedFor:"getPointRadius"}};class Kt extends Fe{initializeState(){this.state={layerProps:{},features:{}}}updateState({props:e,changeFlags:t}){if(!t.dataChanged)return;const{data:i}=this.props,o=i&&"points"in i&&"polygons"in i&&"lines"in i;this.setState({binary:o}),o?this._updateStateBinary({props:e,changeFlags:t}):this._updateStateJSON({props:e,changeFlags:t})}_updateStateBinary({props:e,changeFlags:t}){const i=_o(e.data,this.encodePickingColor);this.setState({layerProps:i})}_updateStateJSON({props:e,changeFlags:t}){const i=yo(e.data),o=this.getSubLayerRow.bind(this);let s={};const r={};if(Array.isArray(t.dataChanged)){const l=this.state.features;for(const c in l)s[c]=l[c].slice(),r[c]=[];for(const c of t.dataChanged){const u=pt(i,o,c);for(const d in l)r[d].push(Wt({data:s[d],getIndex:g=>g.__source.index,dataRange:c,replace:u[d]}))}}else s=pt(i,o);const a=Po(s,r);this.setState({features:s,featuresDiff:r,layerProps:a})}getPickingInfo(e){const t=super.getPickingInfo(e),{index:i,sourceLayer:o}=t;return t.featureType=Co.find(s=>o.id.startsWith("".concat(this.id,"-").concat(s,"-"))),i>=0&&o.id.startsWith("".concat(this.id,"-points-text"))&&this.state.binary&&(t.index=this.props.data.points.globalFeatureIds.value[i]),t}_updateAutoHighlight(e){const t="".concat(this.id,"-points-"),i=e.featureType==="points";for(const o of this.getSubLayers())o.id.startsWith(t)===i&&o.updateAutoHighlight(e)}_renderPolygonLayer(){const{extruded:e,wireframe:t}=this.props,{layerProps:i}=this.state,o="polygons-fill",s=this.shouldRenderSubLayer(o,i.polygons.data)&&this.getSubLayerClass(o,ze.type);if(s){const r=be(this,ze.props),a=e&&t;return a||delete r.getLineColor,r.updateTriggers.lineColors=a,new s(r,this.getSubLayerProps({id:o,updateTriggers:r.updateTriggers}),i.polygons)}return null}_renderLineLayers(){const{extruded:e,stroked:t}=this.props,{layerProps:i}=this.state,o="polygons-stroke",s="linestrings",r=!e&&t&&this.shouldRenderSubLayer(o,i.polygonsOutline.data)&&this.getSubLayerClass(o,ce.type),a=this.shouldRenderSubLayer(s,i.lines.data)&&this.getSubLayerClass(s,ce.type);if(r||a){const l=be(this,ce.props);return[r&&new r(l,this.getSubLayerProps({id:o,updateTriggers:l.updateTriggers}),i.polygonsOutline),a&&new a(l,this.getSubLayerProps({id:s,updateTriggers:l.updateTriggers}),i.lines)]}return null}_renderPointLayers(){const{pointType:e}=this.props,{layerProps:t,binary:i}=this.state;let{highlightedObjectIndex:o}=this.props;!i&&Number.isFinite(o)&&(o=t.points.data.findIndex(a=>a.__source.index===o));const s=new Set(e.split("+")),r=[];for(const a of s){const l="points-".concat(a),c=le[a],u=c&&this.shouldRenderSubLayer(l,t.points.data)&&this.getSubLayerClass(l,c.type);if(u){const d=be(this,c.props);let g=t.points;if(a==="text"&&i){const{instancePickingColors:f,...p}=g.data.attributes;g={...g,data:{...g.data,attributes:p}}}r.push(new u(d,this.getSubLayerProps({id:l,updateTriggers:d.updateTriggers,highlightedObjectIndex:o}),g))}}return r}renderLayers(){const{extruded:e}=this.props,t=this._renderPolygonLayer(),i=this._renderLineLayers(),o=this._renderPointLayers();return[!e&&t,i,o,e&&t]}getSubLayerAccessor(e){const{binary:t}=this.state;return!t||typeof e!="function"?super.getSubLayerAccessor(e):(i,o)=>{const{data:s,index:r}=o,a=Hi(s,r);return e(a,o)}}}y(Kt,"layerName","GeoJsonLayer");y(Kt,"defaultProps",Lo);export{Pt as ArcLayer,_t as BitmapLayer,We as ColumnLayer,Kt as GeoJsonLayer,zt as GridCellLayer,pe as IconLayer,Lt as LineLayer,he as PathLayer,bt as PointCloudLayer,Gt as PolygonLayer,De as ScatterplotLayer,xe as SolidPolygonLayer,Ve as TextLayer,Ge as _MultiIconLayer,Be as _TextBackgroundLayer};
