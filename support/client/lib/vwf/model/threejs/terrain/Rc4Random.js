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