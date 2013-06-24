function NoiseTerrainAlgorithm(seed) 
{	importScripts('simplexNoise.js');
	this.displace= function(vert)
	{
		var z = 0;
		z = this.SimplexNoise.noise2D((vert.x)/10000,(vert.y)/1000) * 15;
		z = z*z;
		z += this.SimplexNoise.noise2D((vert.x)/100000,(vert.y)/100000) * 450;
		z += this.SimplexNoise.noise2D((vert.x)/10000,(vert.y)/100000) * 250;
		z += this.SimplexNoise.noise2D((vert.x)/1000,(vert.y)/100) * 25;
		z += this.SimplexNoise.noise2D((vert.x)/1000,(vert.y)/5000) * 50;
		z += this.SimplexNoise.noise2D((vert.x)/500,(vert.y)/50) * 10;
		 z += this.SimplexNoise.noise2D((vert.x)/100,(vert.y)/100) * 5.0;
		 z += this.SimplexNoise.noise2D((vert.x)/20,(vert.y)/20) * 1.5;
		 z += this.SimplexNoise.noise2D((vert.x)/5,(vert.y)/5) * .25;
		var canynon = this.SimplexNoise.noise2D((vert.x)/2000,(vert.y)/10000) * -50;
			if(canynon < -30)
			{
				canynon += 30;
				canynon *= canynon;
				}
			else
				canynon = 0;
			z-= canynon;	
		if(z < 0)  
		{
			z/=5;
			
		}
		return z + 30;
	}
	this.Random = function(seed)
    {
        function Rc4Random(seed)
        {
            var keySchedule = [];
            var keySchedule_i = 0;
            var keySchedule_j = 0;
            
            function init(seed) {
                for (var i = 0; i < 256; i++)
                    keySchedule[i] = i;
                
                var j = 0;
                for (var i = 0; i < 256; i++)
                {
                    j = (j + keySchedule[i] + seed.charCodeAt(i % seed.length)) % 256;
                    
                    var t = keySchedule[i];
                    keySchedule[i] = keySchedule[j];
                    keySchedule[j] = t;
                }
            }
            init(seed);
            
            function getRandomByte() {
                keySchedule_i = (keySchedule_i + 1) % 256;
                keySchedule_j = (keySchedule_j + keySchedule[keySchedule_i]) % 256;
                
                var t = keySchedule[keySchedule_i];
                keySchedule[keySchedule_i] = keySchedule[keySchedule_j];
                keySchedule[keySchedule_j] = t;
                
                return keySchedule[(keySchedule[keySchedule_i] + keySchedule[keySchedule_j]) % 256];
            }
            
            this.getRandomNumber = function() {
                var number = 0;
                var multiplier = 1;
                for (var i = 0; i < 8; i++) {
                    number += getRandomByte() * multiplier;
                    multiplier *= 256;
                }
                return number / 18446744073709551616;
            }.bind(this);
            this.Random = this.getRandomNumber;
			this.random = this.getRandomNumber;
        }
		return  new Rc4Random(seed +"");
    
	}
	this.SimplexNoise = new SimplexNoise(this.Random(seed).random);
}