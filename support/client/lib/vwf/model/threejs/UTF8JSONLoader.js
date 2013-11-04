
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //UTF8 loader
    

    function DecodeARRAY_BUFFER(str,range,inmin,stride,bits)
    {
     str = blobarray[str];
      var attribs_out = [];//new Float32Array(str.length);
      //min = min + 0.0;
      var prev = [0,0,0];
      var divisor = Math.pow(2,bits);
      for (var i = 5; i < str.length-5; i+=stride) {

          for(var j = 0; j< stride; j++)
            {     
                  var code = str.charCodeAt(i+j);
                  var dezigzag = (Number(code) >> 1) ^ (-(Number(code) & 1));
                  prev[j] += dezigzag;
                  var prev_attrib = ((prev[j]/divisor)*(range))  + Number(inmin) ;//(code >> 1) ^ (-(code & 1));
                  attribs_out.push(prev_attrib);
            }     
      }
     
      return attribs_out;
    }
    var debugarraytype = "";
    function DecodeELEMENT_ARRAY_BUFFER(str,range)
    {
     
      str = blobarray[str];
      var attribs_out = [];//new Uint16Array(str.length);
      var prev = 0;
      for (var i = 5; i < str.length-5; i++) {
     
          var code = str.charCodeAt(i);
          var dezigzag = (code >> 1) ^ (-(code & 1));;
          prev += dezigzag;
         // alert("char code " +code + " dezigzag " + dezigzag + " new value " + prev);
          attribs_out.push(prev);
          
      }
     
      return attribs_out;
    }

    function DecodeArray(array,key)
    {
        var type = array.type;
        var array2 =[];
        var itemsize = array.itemSize;
        
        if(type == "ELEMENT_ARRAY_BUFFER")
            array2 = DecodeELEMENT_ARRAY_BUFFER(array.elements.values,array.elements.range);
        if(type == "ARRAY_BUFFER")
            array2 = DecodeARRAY_BUFFER(array.elements.values,array.elements.range,array.elements.min,itemsize,array.elements.bits);    
        
        return array2;
    }
	function decompressArrays(node)
	{
		 if (node.attributes) {
					for(var i in node.attributes)
					{
						
					   var attributeArray = node.attributes[i];
					   
					   node.attributes[i] = DecodeArray(attributeArray,i);
					}
		 }
		  for (i in node.primitives) {
					if (node.primitives[i].indices) {
						var array = node.primitives[i].indices;
						array = DecodeArray(array);
						node.primitives[i].indices = array;
					}
			}
		 if(node.children)
		 {
			for( var i =0; i < node.children.length; i++)
				decompressArrays(node.children[i]);
		 }
	}
    function UTF8JsonLoader(node,callback,errorCallback)
    {
        
        var self = this;
        this.url = node.source;
        this.callback = callback;
        this.children=[];
        
        this.jsonLoaded = function(e)
        {
            var test = 1+1;
            //async decompress UTF8 data in webworker
			alertify.log('Decompressing ' + this.url);
			
			
			
			
			
			backgroundLoader.decompress(e,function(jsonData)
			
			{
				
//				var jsonData = JSON.parse(decompress(e));
//				decompressArrays(jsonData)
				
				var texture_load_callback = function(texturename)
				{
					
					var src = "";
					if(this.url.toLowerCase().indexOf('3dr_federation') != -1)
						src = this.url.substr(0,this.url.indexOf("Model/")) + "textures/NoRedirect/" + encodeURIComponent(texturename) +"?ID=00-00-00";
					else
						src = this.url.substr(0,this.url.indexOf("Model/")) + "textures/" + encodeURIComponent(texturename) +"?ID=00-00-00";
					
					src = src.replace("AnonymousUser:@","");
					
					var tex = _SceneManager.getTexture(src);
					
					return tex;
				}
				this.scene = ParseSceneGraph(jsonData,texture_load_callback.bind(this));
				if(this.callback)
					this.callback(this);
				
				
			}.bind(this));
				
        }.bind(this);
        
        this.error = function(e)
        {
           if(errorCallback)
				errorCallback();
        }.bind(this);
        
        $.ajax({
            url: this.url,
            data: {},
            success: this.jsonLoaded,
            error: this.error.bind(this),
            dataType:'text'
        });
        ;
    }

    

    function BuildUTF8JsonNode(node,callback,err)
    {
        return new UTF8JsonLoader(node,callback,err);
    }
    function toColor(arr)
        {
            var color = new THREE.Color();
            color.setRGB(arr[0],arr[1],arr[2],arr[3]);
            return color;
        }
    function ApplyMaterial(newnode,newmaterial)
    {
        if(newnode instanceof THREE.Mesh)
            newnode.material = newmaterial;
        else if( newnode.children)
        {
            for(var i =0; i < newnode.children.length;i++)
                ApplyMaterial(newnode.children[0],newmaterial);
        }   
    }   
	function isIdentityMatrix(matrix)
{
	
	if(matrix == null)
		return true;
	if(
	matrix[0] == 1 &&	
	matrix[1] == 0 &&
	matrix[2] == 0 &&
	matrix[3] == 0 &&
	matrix[4] == 0 &&
	matrix[5] == 1 &&
	matrix[6] == 0 &&
	matrix[7] == 0 &&
	matrix[8] == 0 &&
	matrix[9] == 0 &&
	matrix[10] == 1 &&
	matrix[11] == 0 &&
	matrix[12] == 0 &&
	matrix[13] == 0 &&
	matrix[14] == 0 &&
	matrix[15] == 1)
		return true;
	return false;	
}
    function ParseSceneGraph(node, texture_load_callback) {
        
        var newnode;
        //its geometry
        if (node.primitives) {
            
            //newnode = new THREE.Object3D();
            var geo = new THREE.Geometry();
            var mesh = newnode = new THREE.Mesh(geo,new THREE.MeshPhongMaterial());
			mesh.castShadow = true;
			mesh.receiveShadow = true;
            mesh.geometry.normals = [];
            mesh.geometry.UVS = [];
            
            
            
            //vertex data
            if (node.attributes) {
                jQuery.each(node.attributes, function(key, element) {
                   // debugarraytype = key;
                   // var attributeArray = node.attributes[key];
                   // node.attributes[key] = DecodeArray(attributeArray,key);
                    if(key == "Vertex")
                    {
                        for(var i = 0; i < node.attributes[key].length-2; i+= 3)
                        {
                            var vert = new THREE.Vector3(node.attributes[key][i],node.attributes[key][i+1],node.attributes[key][i+2]);
                            mesh.geometry.vertices.push(vert);
                        }
                    }
                    if(key == "Normal")
                    {
                        for(var i = 0; i < node.attributes[key].length-2; i+= 3)
                        {
                            var norm = new THREE.Vector3(node.attributes[key][i],node.attributes[key][i+1],node.attributes[key][i+2]);
                            mesh.geometry.normals.push(norm);
                        }
                    }
                    if(key == "TexCoord0")
                    {
                        for(var i = 0; i < node.attributes[key].length-1; i+= 2)
                        {
                            var uv = new THREE.Vector2(node.attributes[key][i],node.attributes[key][i+1]);
                            mesh.geometry.UVS.push(uv);
                        }
                    }
                    
                    if(key == "VertexColor")
                    {
                        for(var i = 0; i < node.attributes[key].length-3; i+= 4)
                        {
                            var vert = new THREE.Vector3(node.attributes[key][i],node.attributes[key][i+1],node.attributes[key][i+2]);
                            mesh.geometry.colors.push(vert);
                            
                        }
                    }               
                });
            }
            
            var i;
            for (i in node.primitives) {
                
                if (node.primitives[i].indices) {
                    var array = node.primitives[i].indices;
                    //array = DecodeArray(array);
                    
                    for(var j = 0; j < array.length-2; j+= 3)
                    {
                        var face = new THREE.Face3(array[j],array[j+1],array[j+2],new THREE.Vector3(0,1,0),new THREE.Color('#000000'),0);
                        //in this case, the compression of the mesh index array to 16 bits has wrapped some indexes around the maximum
						if(face.a < 0 || face.b < 0 || face.c < 0)
							continue;
						if(face.a > mesh.geometry.vertices.length || face.b > mesh.geometry.vertices.length || face.c > mesh.geometry.vertices.length)
							continue;	
						face.vertexNormals.push(mesh.geometry.normals[face.a]);
                        face.vertexNormals.push(mesh.geometry.normals[face.b]);
                        face.vertexNormals.push(mesh.geometry.normals[face.c]);
                        mesh.geometry.faces.push(face);
						if(mesh.geometry.UVS && mesh.geometry.UVS.length > 0)
							mesh.geometry.faceVertexUvs[0].push([mesh.geometry.UVS[face.a],mesh.geometry.UVS[face.b],mesh.geometry.UVS[face.c]]);
						else
							mesh.geometry.faceVertexUvs[0].push([new THREE.Vector2(0,0),new THREE.Vector2(0,1),new THREE.Vector2(1,1)]);	

                    }
                } else {
                    mode = gl[mode];
                    var first = node.primitives[i].first;
                    var count = node.primitives[i].count;
                    if (count > 65535)
                        count = 32740;
                    //node.primitives[i] = new osg.DrawArrays(mode, first, count);
                }
            }
            
            
            mesh.geometry.verticesNeedUpdate  = true;
            mesh.geometry.facesNeedUpdate  = true;
			mesh.geometry.computeBoundingSphere();
			mesh.geometry.computeBoundingBox();
         }
            var newmaterial = null;
            if (node.stateset) {
                newmaterial = new THREE.MeshPhongMaterial();
				newmaterial.map = _SceneManager.getTexture('white.png');
                if (node.stateset.textures) {
                    var textures = node.stateset.textures;
                    for ( var t = 0, tl = textures.length; t < tl; t++) {
                        if (textures[t] === undefined) {
                            continue;
                        }
                        if (!textures[t].file) {
                            if (console !== undefined) {
                            console.log("no 'file' field for texture "
                                + textures[t]);
                            }
                        }

                        var tex;
                        if (texture_load_callback)
                            tex = texture_load_callback(textures[t].file);
                        else
                        {
                            tex = _SceneManager.getTexture(textures[t].file);
                        }
                        if (tex) {
                            tex.wrapS = THREE.RepeatWrapping;
                            tex.wrapT = THREE.RepeatWrapping;
                            newmaterial.map = tex;
                            newmaterial.needsUpdate = true;
                        }
                    }
                }
                if (node.stateset.material) {
                    newmaterial.ambient = (toColor(node.stateset.material.diffuse));
                    newmaterial.color = (toColor(node.stateset.material.diffuse));
                    newmaterial.alpha = 1.0;
                    newmaterial.shininess = (node.stateset.material.shininess);
                    newmaterial.specular = (toColor(node.stateset.material.specular));
					newmaterial.reflectivity = 0;
                    newmaterial.needsUpdate = true;
                }
                
            }
            
            
            
        if (node.matrix) {
        
            if(newnode == null)
                newnode = new THREE.Object3D();
            var matrix = [];
            for(var i =0; i < node.matrix.length; i++)
                matrix.push(node.matrix[i]);
            var glmat = new THREE.Matrix4();
            glmat.elements = matrix;
            
            
                            
                                            
            //glmat = glmat.multiply(flipmat,glmat);
            
            //glmat = glmat.transpose();
            newnode.matrix.copy(glmat)  
            newnode.matrixAutoUpdate = false;
        }
        
        if (node.children) {
            if(newnode == null)
                newnode = new THREE.Object3D();
            for ( var child = 0; child < node.children.length; child++) {
                var childnode = ParseSceneGraph(node.children[child],texture_load_callback);
                if(childnode)
                    newnode.add(childnode);
            }
        }
        
        if(newnode && newmaterial)
            ApplyMaterial(newnode,newmaterial);
        
        if(node.name && newnode)
            newnode.name = node.name;
        
		if(newnode && newnode.children && newnode.children.length == 1 && isIdentityMatrix(newnode.matrix.elements))
		return newnode.children[0];
		
        return newnode;
    }
    var blobsfound = 0;
    var blobarray = [];

    function DecompressStrings(data, replace, find)
    {
        var reg = new RegExp(find,'g');
        return data.replace(reg, replace);
    }

    function decompressJsonStrings(data)
    {
    data = DecompressStrings(data,"\"min\":","min:");
    data = DecompressStrings(data,"\"max\":","max:");
    data = DecompressStrings(data,"\"stateset\":","ss:");
    data = DecompressStrings(data,"\"LINE_LOOP\"","\"LL\"");
    data = DecompressStrings(data,"\"LINEAR\"","\"L\"");
    data = DecompressStrings(data,"\"LINEAR_MIPMAP_LINEAR\"","\"LML\"");
    data = DecompressStrings(data,"\"LINEAR_MIPMAP_NEAREST\"","\"LMN\"");
    data = DecompressStrings(data,"\"NEAREST\"","\"NE\"");
    data = DecompressStrings(data,"\"NEAREST_MIPMAP_LINEAR\"","\"NML\"");
    data = DecompressStrings(data,"\"NEAREST_MIPMAP_NEAREST\"","\"NMN\"");
    data = DecompressStrings(data,"\"mag_filter\":","maf:");
    data = DecompressStrings(data,"\"min_filter\":","mif:");
    data = DecompressStrings(data,"\"file\":","f:");
    data = DecompressStrings(data,"\"name\":","n:");
    data = DecompressStrings(data,"\"ambient\":","a:");
    data = DecompressStrings(data,"\"diffuse\":","d:");
    data = DecompressStrings(data,"\"specular\":","s:");
    data = DecompressStrings(data,"\"emission\":","e:");
    data = DecompressStrings(data,"\"shininess\":","sh:");
    data = DecompressStrings(data,"\"textures\":","t:");
    data = DecompressStrings(data,"\"material\":","m:");
    data = DecompressStrings(data,"\"POINTS\"","\"P\"");
    data = DecompressStrings(data,"\"LINES\"","\"LI\"");

    data = DecompressStrings(data,"\"LINE_STRIP\"","\"LS\"");
    data = DecompressStrings(data,"\"TRIANGLES\"","\"T\"");
    data = DecompressStrings(data,"\"TRIANGLE_FAN\"","\"TF\"");
    data = DecompressStrings(data,"\"TRIANGLE_STRIP\"","\"TS\"");
    data = DecompressStrings(data,"\"first\":","fi:");
    data = DecompressStrings(data,"\"count\":","co:");
    data = DecompressStrings(data,"\"mode\":","mo:");
    data = DecompressStrings(data,"\"undefined\":","u:");
    data = DecompressStrings(data,"\"children\":","c:");
    data = DecompressStrings(data,"\"range\":","r:");
    data = DecompressStrings(data,"\"bits\":","b:");
    data = DecompressStrings(data,"\"values\":","v:");
    data = DecompressStrings(data,"\"elements\":","el:");
    data = DecompressStrings(data,"\"itemSize\":","iS:");
    data = DecompressStrings(data,"\"type\":","ty:");
    data = DecompressStrings(data,"\"ARRAY_BUFFER\"","\"AB\"");
    data = DecompressStrings(data,"\"ELEMENT_ARRAY_BUFFER\"","\"EAB\"");
    data = DecompressStrings(data,"\"indices\":","i:");
    data = DecompressStrings(data,"\"Vertex\":","V:");
    data = DecompressStrings(data,"\"Normal\":","N:");
    data = DecompressStrings(data,"\"TexCoord0\":","T0:");
    data = DecompressStrings(data,"\"TexCoord1\":","T1:");
    data = DecompressStrings(data,"\"TexCoord2\":","T2:");
    data = DecompressStrings(data,"\"TexCoord3\":","T3:");
    data = DecompressStrings(data,"\"TexCoord4\":","T4:");
    data = DecompressStrings(data,"\"attributes\":","A:");
    data = DecompressStrings(data,"\"primitives\":","p:");
    data = DecompressStrings(data,"\"projection\":","pr:");
    data = DecompressStrings(data,"\"matrix\":","M:");

    return data;
    }

    function decompress(dataencoded)
    {
        blobsfound = 0;
        blobarray = [];

        var regex = new RegExp('\u7FFF\u7FFE\u7FFF\u7FFE\u7FFF[\\S\\s]*?\u7FFE\u7FFF\u7FFE\u7FFF\u7FFE','igm');
        blobarray = dataencoded.match(regex);
        var data = dataencoded.replace(regex,function(match) { return "\""+(blobsfound++)+"\"";});
        data = decompressJsonStrings(data);
        return data;
    }