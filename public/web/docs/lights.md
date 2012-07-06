Lights
==========================
 
The VWF Lights capability provides control of lighting within a VWF application. Lights are intended to be standard generic components described within the WebGL Framework. The VWF architecture supports different renderers on the backside, and therefore supports most common properties.  This allows for a piece of geometry or scene that has associated lights to be driven from any VWF supported WebGL framework.

---

###Light Types

---

####Point
A point light is represented by a point source. It radiates light in all directions, and has a certain position in space. The differences between a point light and a directional light are: the directional light lights all object from the same direction, while a point light lights an object depending on the position of the object relative to the light. Also, a point light only illuminates objects that are close to it. The further the object is, the less illuminated it becomes. This gives us a great advantage. Because only objects that are close enough to the lights are lit, we only need to apply the lighting computations to a certain area on the screen, instead of applying a full-screen pass. This means that if the lights do not overlap too much in the screen-space, many small point lights will, on the whole, be as expensive as one directional light (which is applied on the whole screen).

~~~
 Omni01:
    extends: http://vwf.example.com/light.vwf
    properties:
      lightType: "point"
      constantAttenuation: 1
      linearAttenuation: 0.002
      quadraticAttenuation: 0.0008
      diffuse: true 
      specular: true
      samples: 0
      softness: 0.01
      bufferHeight: 256
      bufferWidth: 256
      shadowBias: 2.0
      distance: 100.0
      castShadows: false
      translation: [ -150, 150, 182 ]
~~~~	  

 
####Directional
Directional lights are lights which equally illuminate all objects from a given direction. Because all objects are equally illuminated, the computations for directional lights need to be done on all pixels on the screen. An example of a real-world directional light source is the sun.  This makes these types of lights expensive, so it is recommended to have a small number of directional lights. This limitation will not exist for other types of lights.

~~~
  dir1:
    extends: http://vwf.example.com/light.vwf
    properties:
      lightType: "directional"
      quadraticAttenuation: 10
      specular: false 
      rotation: [ 1, 0, 0, -10 ]
~~~~	  

####Spot
Spot lights are point light sources that have restricted the shape of the light it emits to a cone rather than a sphere.  Spotlights follow all other rules of point lights and share the similar properties. A desk lamp is an example of a spot light source.

~~~
 Spot01:
    extends: http://vwf.example.com/light.vwf
    properties:
      lightType: "point"
      constantAttenuation: 1
      linearAttenuation: 0.002
      quadraticAttenuation: 0.0008
      spotCosCutOff: 0.95
      spotExponent: 10
      diffuse: true 
      specular: true
      samples: 0
      softness: 0.01
      bufferHeight: 256
      bufferWidth: 256
      shadowBias: 2.0
      distance: 100.0
      castShadows: false
      translation: [ -150, 150, 182 ]
~~~~	  

---

###Light Attenuation  
  
---

Light attenuation is an exponential factor corresponding to the loss of light as distance from the light increases. Since a directional light is infinitely far away, it doesn't make sense to attenuate its intensity over distance, so attenuation is disabled for a directional light. However, you may want to attenuate the light of a point or spot light source over distance. 

Attenuation is the decrease in intensity of the light with respect to distance. The attenuation for a light is calculated as ([Quad]x)^2+[Linear]x+[Constant] where [Quad is the quadratic attenuation, [Linear] is the linear attenuation, [Constant] is the constant attenuation and x is the distance from the light source.
  
The default values for these are:  
constantAttenuation = 1  
linearAttenuation = 0  
quadraticAttenuation = 0  
  
When blending between these three types of attenuation, you set the proportions of each attenuation type against the other two types. To avoid confusion, keep in mind that you can set the scale of these proportions as you wish: A proportion of 3:6:1 gives the exact same result as 6:12:2, or 30:60:10, which can easily be translated to 30%, 60% and 10%. Also note that since attenuation requires an additional division (and possibly more math) for each calculated color, using attenuated lights may slow down application performance.
   
####constantAttenuation  
 
The 100% constant attenuation will result in a light that has no attenuation at all. The intensity, represented by the brigtness setting of the light entity, will be totally unaffected by distance, continuing until it hits a surface, theoretically capable of illuminating an infinite area. This type of light can be seen from the sky (sunlight, moonlight and starlight), and other large and distant light sources. It can also be used for setting local ambient lighting (by letting it illuminate the shadows of the room) or mood lighting. As a 100% constant lightsource is an extreme type of light, constant light is mostly used in combination with the other two types of attenuations, to "soften" or limit them.
  
####linearAttenuation  
  
Mathematically, the decline of this type of light is linear, inversely proportial to the distance from the light source (I = 1/d where I is intensity and d is distance). This means that the light intensity (set by its brightness) will diminish (at a fixed rate) as it travels from its source. In the real world a 100% linear lightsource would be practically impossible, as it would represent a real world soft light of infinite size, but in the virtual world, a 0:1:0 lightsource is believable for most entity based lightsources.
  
####quadraticAttenuation  
  
Mathematically, the attenuation of a 100% quadratic light is exponential (quadratic), expressed as "I = 1/d^2", meaning that the further the light travels from its source, the more it will be diminished. This creates a very sharp drop in light. When used in moderation, quadratic attenuation can be used not only for small lightsources, but also to reflect light travelling through something more dispersing than air, like air humidity (like fog) or water.

---

###Spot Light Properties

---

####SpotCosCutOff  
  
The first element spotCosCutOff represents the cosine of the angle beyond which the light is cut off. This angle is measured from the light's spot direction compared with the light location vector. In effect, it is a check to see if the fragment is within the cone of the light. The use of the *cosine* of the angle is to allow for very fast checks against the dot-product of the normalized vectors.
  
####SpotExponent  
   
The second element, spotExponent, is used to calculate the amount of "spotiness" of the spotlight. That is, the amount to which the spotlight focuses light on the center of the beam versus the outside of the beam. A higher spotExponent will cause the spotlight to "focus" more, a lower exponent will cause the spotlight to act more like a "shielded" point-light (such as a lamp with blockers rather than reflectors).

---

###Lighting Effects  

---

####Diffuse Reflection  
   
Diffuse reflection is the reflection of light from a surface such that an incident ray is reflected at many angles rather than at just one angle as in the case of specular reflection. An illuminated ideal diffuse reflecting surface will have equal luminance from all directions in the hemisphere surrounding the surface.

The diffuse property determines what color the highlight (a.k.a the diffuse reflection of a light on a model) will be.

###Specular Reflection  
  
Specular reflection is the mirror-like reflection of light (or of other kinds of wave) from a surface, in which light from a single incoming direction (a ray) is reflected into a single outgoing direction. Such behavior is described by the law of reflection, which states that the direction of incoming light (the incident ray), and the direction of outgoing light reflected (the reflected ray) make the same angle with respect to the surface normal.

The specular property determines what color the highlight (a.k.a the specular reflection of a light on a model) will be.

---

###Shadows

---

####Samples  
   
The number of samples for this shadow. 
 
####Softness  
  
The softness value of the shadow.  

####bufferHeight   
  
The Shadow Buffer Memory size for the resolution height of the shadow.

####bufferWidth  
  
The Shadow Buffer Memory size for the resolution width of the shadow.

####shadowBias  
  
The shadow buffer bias. Map bias moves the shadow toward or away from the shadow-casting object (or objects).

####distance   
   
The shadow casting distance

####castShadows  
   
The shadow casting flag. True if casting shadows is enabled.
