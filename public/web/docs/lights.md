Lights
==========================
 
The VWF Lights capability provides control of lighting within a VWF application. By default, VWF provides default lighting. In addition, there are three basic light types that can be created within the framework. Each light has properties associated with it that can be manipulated, including attenuation, effects, and shadows. A complete list of light properties can be found in the [Application API](application.html) under *light.vwf*.

---

Light Types
--------------------------

**Point**

A point light is represented by a point source in 3D space, and emits light in all directions. The closer an object is to the light source, the more illuminated it becomes.

~~~
 Omni01:
    extends: http://vwf.example.com/light.vwf
    properties:
      lightType: "point"
      translation: [ -150, 150, 150 ]
~~~~	  

**Directional**

Directional lights equally illuminate all objects from a given direction. An application should only have a small number of directional lights if needed, as computations for directional lights need to be done on all pixels on the screen. 

~~~
  dir1:
    extends: http://vwf.example.com/light.vwf
    properties:
      lightType: "directional"
      rotation: [ 1, 0, 0, -10 ]
~~~~	  

**Spot**

Spot lights emit light in a cone shape instead of a sphere. Other than that, spot lights and point lights share the similar properties. Spot lights also have the additional properties of spotCosCutOff and spotExponent, as described in the light API.

~~~
 Spot01:
    extends: http://vwf.example.com/light.vwf
    properties:
      lightType: "spot"
      spotCosCutOff: 0.95
      spotExponent: 10
      translation: [ -150, 150, 150 ]
~~~~	  

---

Light Attenuation
--------------------------

Light attenuation is the decrease in intensity of the light with respect to distance, and applies to both point and spot lights. There are three types of light attenuation: constant, linear, and quadratic. Values for each attenuation type fall between 0 and 1. Attenuation types may be blended to sum of 1. The default values for these are:

* constantAttenuation  = 1
* linearAttenuation    = 0
* quadraticAttenuation = 0
   
**constantAttenuation**
 
Constant attenuation of 1 will result in a light where the intensity is unaffected by distance, and will remain constant until it hits a surface.
  
**linearAttenuation**
  
Linear attenutation will result in a light thats intensity is inversely proportial to the distance from the light source. In other words, the light intensity will diminish at a fixed rate as it travels from the source. 
  
**quadraticAttenuation**

Quadratic attenuation is the most dramatic, where the drop off is exponential to the distance an object is from the light source.

---

Lighting Effects  
--------------------------

**Specular Reflection**

Specular reflection is the reflection of light from a surface where the ray is reflected in a single direction. 

**Diffuse Reflection**
   
Diffuse reflection is the reflection of light from a surface where the ray is reflected at many angles.
