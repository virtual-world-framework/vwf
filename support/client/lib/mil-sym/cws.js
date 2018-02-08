"use strict";

define( function(){

    var cws = {
        "def": {
            "1WTRFF": "ONE-WAY TRAFFIC",
            "2WTRFF": "TWO-WAY TRAFFIC",
            "AA/C": "ANTI-AIRCRAFT",
            "AAFF": "AXIS OF ADVANCE FOR FEINT",
            "AAM": "AIR TO AIR MISSILE (AAM)",
            "AARM": "ANTI ARMOR",
            "AAST": "AIR ASSAULT",
            "AB": "AIRPORT/AIRBASE",
            "ABN": "AIRBORNE",
            "ABNCP": "AIRBORNE COMMAND POST",
            "ABNEW": "AIRBORNE EARLY WARNING (AEW)",
            "ABNINC": "AIRBORNE INTERCEPT",
            "ABNSB": "AIRBORNE SEARCH & BOMBING",        
            "ABP": "EXPLOSIVES, STATE OF READINESS 2 (ARMED-BUT PASSABLE)", 
            "ABS": "ABATIS", 
            "ABYARA": "ASSEMBLY AREA", 
            "ACA": "AIRSPACE COORDINATION AREA (ACA)", 
            "ACDR": "AIR CORRIDOR", 
            "ACP": "AIR CONTROL POINT (ACP)", 
            "ACTL": "AIR CONTROL", 
            "ACTPNT": "ACTION POINTS (GENERAL)", 
            "ACU": "ACOUSTIC", 
            "ACYC": "ANTICYCLONE CENTER", 
            "ADF": "AIR DEFENSE", 
            "ADFAD": "AIR DEFENSE (AD)", 
            "ADFG": "AIR DEFENSE GUN", 
            "ADMIN": "ADMINISTRATIVE (ADMIN)", 
            "AEP": "AMBULANCE EXCHANGE POINT", 
            "AEREXP": "AERIAL EXPLOITATION", 
            "AFP": "ATTACK BY FIRE POSITION", 
            "AHD": "AIRHEAD", 
            "AIMPNT": "AIM POINT", 
            "AIR": "AIR", 
            "AIRFZ": "AIRFIELD ZONE", 
            "AIRTRK": "AIR TRACK", 
            "ALM": "AIR LAUNCHED MISSILE", 
            "ALTUSP": "ALTERNATE DECON SITE/POINT (UNSPECIFIED)", 
            "AMB": "AMBUSH", 
            "AMBLNC": "AMBULANCE", 
            "AMEP": "AMMUNITION AND EXPLOSIVES PRODUCTION", 
            "AMP": "AMPHIBIOUS", 
            "AMPHC": "ATMOSPHERIC", 
            "AMPWS": "AMPHIBIOUS WARFARE SHIP", 
            "AMTP": "ARMAMENT PRODUCTION", 
            "ANCRG1": "ANCHORAGE", 
            "ANCRG2": "ANCHORAGE", 
            "ANCRG3": "ANCHORAGE", 
            "ANG": "ANGLICO", 
            "ANM": "ANM", 
            "AOO": "AREA OF OPERATIONS (AO)", 
            "AP": "AMMUNITION POINTS", 
            "APA": "AIRCRAFT PRODUCTION & ASSEMBLY", 
            "APL": "HIJACKING (AIRPLANE)", 
            "APMNE": "ANTIPERSONNEL (AP) MINES", 
            "APOD": "APOD/APOE", 
            "ARA": "AREA", 
            "ARATGT": "AREA TARGET", 
            "ARC": "ARCTIC", 
            "ARM": "ARMOR", 
            "ARMCV": "ARMORED CARRIER WITH VOLCANO", 
            "ARMD": "ARMORED", 
            "ARMERV": "ARMORED ENGINEER RECON VEHICLE (AERV)", 
            "ARMINF": "ARMORED INFANTRY", 
            "ARMPC": "ARMORED PERSONNEL CARRIER", 
            "ARMVM": "ARMORED VEHICLE MOUNTED", 
            "ARMWVH": "ARMORED WHEELED VEHICLE", 
            "ARR": "ARREST", 
            "ARS": "AREAS", 
            "ARTSVY": "ARTILLERY SURVEY", 
            "ASBW": "ANTI-SUBMARINE WARFARE (ASW)", 
            //"ASBW": "ANTISUBMARINE WARFARE/MPA", 
            "ASBWCB": "ANTISUBMARINE WARFARE (ASW) CARRIER BASED", 
            "ASBWF": "ANTISUBMARINE WARFARE, FIXED WING", 
            "ASBWR": "ANTISUBMARINE WARFARE, ROTARY WING", 
            "ASM": "AIR TO SURFACE MISSILE (ASM)", 
            "ASN": "ARSON/FIRE", 
            "ASP": "AMMUNITION SUPPLY POINT (ASP)", 
            "ASRUT": "ALTERNATE SUPPLY ROUTE", 
            "ASS": "ASSASSINATION/MURDER/EXECUTION", 
            "AST": "ARMORED ASSAULT", 
            "ASTCA": "ASSAULT CROSSING AREA", 
            "ASTPSN": "ASSAULT POSITION", 
            "ASTVES": "ASSAULT VESSEL", 
            "ASUW": "ANTI-SURFACE WARFACE (ASUW)", 
            "ASWSHP": "ASW SHIP", 
            "ASWSUB": "ASW SUBMARINE", 
            "AT": "ANTITANK (AT)", 
            "ATAC": "ATAC", 
            "ATCTL": "AIR TRAFFIC CONTROL", 
            "ATD": "ANTITANK DITCH", 
            "ATDATM": "ANTITANK DITCH REINFORCED WITH ANTITANK MINES TDC COMPLETE", 
            "ATDUC": "UNDER CONSTRUCTION", 
            "ATG": "ANTI-TANK GUN", 
            "ATIZ": "ARTILLERY TARGET INTELLIGENCE (ATI) ZONE", 
            "ATK": "ATTACK", 
            "ATKPSN": "ATTACK POSITION", 
            "ATMAHD": "ANTITANK MINE WITH ANTIHANDLING DEVICE", 
            "ATMDIR": "ANTITANK MINE (DIRECTIONAL)", 
            "ATMER": "ATOMIC ENERGY REACTOR", 
            "ATMNE": "ANTITANK MINE (AT)", 
            "ATN": "AIDS TO NAVIGATION", 
            "ATO": "ANTITANK OBSTACLES", 
            "ATP": "AMMUNITION TRANSFER POINT (ATP)", 
            "ATRFF": "ALTERNATING TRAFFIC", 
            "ATRL": "ANTITANK ROCKET LAUNCHER", 
            "ATW": "ANTITANK WALL", 
            "AVN": "AVIATION", 
            "AXSADV": "AXIS OF ADVANCE", 
            "BAS": "BELTS AND STRIPS", 
            "BB": "BERGY BIT", 
            "BBS": "BATTLESHIP", 
            "BBY": "BOOBY TRAP", 
            "BCN": "BEACON", 
            "BCON": "BRIEF CONTACT", 
            "BDAWTH": "BOUNDED AREAS OF WEATHER", 
            "BEH": "BEACH", 
            "BEHSPE": "BEACH SLOPE", 
            "BERBOX": "BEARING BOX", 
            "BERLNE": "BEARING LINE", 
            "BH": "BACKHOE", 
            "BIO": "BIOLOGICAL", 
            "BIOCA": "BIOLOGICALLY CONTAMINATED AREA", 
            "BIOLUM": "BIOLUMINESCENCE", 
            "BKN": "BROKEN COVERAGE", 
            "BLDS": "BOULDERS", 
            "BLDTSD": "BLOWING DUST OR SAND", 
            "BLK": "BLOCK", 
            "BLSNHY": "BLOWING SNOW - HEAVY", 
            "BLSNLM": "BLOWING SNOW - LIGHT/MODERATE", 
            "BLST": "BALLISTIC MISSILE", 
            //"BLST": "BLACK LIST LOCATION", 
            "BLT": "BELT", 
            "BM": "BOMB/BOMBING", 
            "BMARA": "BOMB AREA", 
            "BMB": "BOMBER", 
            "BNDS": "BOUNDARIES", 
            "BOAT": "HIJACKING (BOAT)", 
            "BRCT": "BROADCAST", 
            "BRG": "BRIDGE", 
            "BRGH": "BRIDGEHEAD", 
            "BRH": "BREACH", 
            "BRHSA": "BERTHS (ANCHOR)", 
            "BRHSO": "BERTHS (ONSHORE)", 
            "BRKS": "BREAKERS", 
            "BSA": "BRIGADE (BSA)", 
            "BT": "BATHYTHERMOGRAPH TRANSMITTING (BT)", 
            "BTFSVL": "BATTLEFIELD SURVEILLANCE", 
            "BTLPSN": "BATTLE POSITION", 
            "BTMCHR": "BOTTOM CHARACTERISTICS", 
            "BTMFAT": "BOTTOM FEATURES", 
            "BTMRGN": "BOTTOM ROUGHNESS", 
            "BTMRTN": "BOTTOM RETURN/NOMBO", 
            "BUOY": "BUOY DEFAULT", 
            "BUS": "BUS", 
            "BW": "BERGY WATER", 
            "BWGJAW": "BREAKWATER/GROIN/JETTY (ABOVE WATER)", 
            "BWGJBW": "BREAKWATER/GROIN/JETTY (BELOW WATER)", 
            "BYS": "BYPASS", 
            "C2ARS": "COMMAND & CONTROL AREAS", 
            "C2GM": "COMMAND AND CONTROL AND GENERAL MANEUVER", 
            "C2HQ": "SPECIAL C2 HEADQUARTERS COMPONENT", 
            "C2LNE": "COMMAND & CONTROL LINES", 
            "C2PNT": "COMMAND & CONTROL POINTS", 
            "C2V": "C2V/ACV", 
            "CALM": "CALM WINDS", 
            "CAP": "COMBAT AIR PATROL (CAP)", 
            "CASS": "COMMAND ACTIVE SONOBUOY SYSTEM (CASS)", 
            "CATK": "COUNTERATTACK (CATK)", 
            "CATKF": "COUNTERATTACK BY FIRE", 
            "CBNP": "CANNIBALIZATION POINT", 
            "CBT": "COMBAT", 
            "CBTPST": "COMBAT OUTPOST", 
            "CBTT": "COMBATANT", 
            "CBWP": "CHEMICAL & BIOLOGICAL WARFARE PRODUCTION", 
            "CCP": "CASUALTY COLLECTION POINT", 
            "CCTA": "CONCERTINA", 
            "CCTRK": "CROSS-COUNTRY TRUCK", 
            "CELL": "CELLULAR/MOBILE", 
            "CFCSG": "CABLE FERRY CROSSING", 
            "CFFZ": "CALL FOR FIRE ZONE (CFFZ)", 
            "CFL": "COORDINATED FIRE LINE (CFL)", 
            "CFZ": "CRITICAL FRIENDLY ZONE (CFZ)", 
            "CGO": "CARGO", 
            "CGOALT": "CARGO AIRLIFT (TRANSPORT)", 
            "CHKPNT": "CHECK POINT", 
            "CID": "CENTRAL INTELLIGENCE DIVISION (CID)", 
            "CINT": "COUNTER INTELLIGENCE", 
            "CIP": "CALL IN POINT", 
            "CIR": "CIRCLE", 
            "CIRCLR": "CIRCULAR", 
            "CIRTGT": "CIRCULAR TARGET", 
            "CLAY": "CLAY", 
            "CLDFRN": "COLD FRONT", 
            "CLE": "CIVILIAN LAW ENFORCEMENT", 
            "CLM": "CLAYMORE", 
            "CLR": "CLEAR", 
            "CLS1": "CLASS I", 
            "CLS10": "CLASS X", 
            "CLS2": "CLASS II", 
            "CLS3": "CLASS III", 
            "CLS4": "CLASS IV", 
            "CLS5": "CLASS V", 
            "CLS6": "CLASS VI", 
            "CLS7": "CLASS VII", 
            "CLS8": "CLASS VIII", 
            "CLS9": "CLASS IX", 
            "CLT": "COLT/FIST", 
            "CM": "CRUISE MISSILE", 
            "CMDOPN": "COMMAND OPERATIONS", 
            "CML": "CHEMICAL", 
            "CMLCA": "CHEMICALLY CONTAMINATED AREA", 
            "CMPS": "COMPOSITE", 
            "CNG": "CONVERGENCE", 
            "CNGLNE": "CONVERGANCE LINE", 
            "CNL": "CANAL", 
            "CNS": "CENSOR ZONE", 
            "CNT": "CONTAIN", 
            "CNVPRN": "CONVENTIONAL PROPULSION", 
            "CNY": "CONVOY", 
            "CNZ": "CANALIZE", 
            "COBL": "COBBLES", 
            "COBLOS": "COBBLES, OYSTER SHELLS", 
            "COMCP": "COMMUNICATION CONFIGURED PACKAGE", 
            "COMM": "COMMUNICATIONS", 
            "COMMCP": "COMMUNICATIONS CHECKPOINT (CCP)", 
            "CONPNT": "CONTACT POINT", 
            "COV": "COVER", 
            "CPL": "CHAPARRAL", 
            "CRCD": "RECRUITMENT (COERCED/IMPRESSED)", 
            "CRDPNT": "COORDINATION POINT", 
            "CRDRTB": "CORRIDOR TAB", 
            "CRK": "CRACKS", 
            "CRKASL": "CRACKS AT A SPECIFIC LOCATION", 
            "CRL": "CORAL", 
            "CRP": "CORPS", 
            "CRR": "CARRIER", 
            "CRU": "CRUISER", 
            "CRV": "DEPTH CURVE", 
            "CS": "COMBAT SUPPORT", 
            "CSAR": "COMBAT SEARCH AND RESCUE (CSAR)", 
            "CSE": "COARSE", 
            "CSESD": "COARSE SAND", 
            "CSESLT": "COARSE SILT", 
            "CSGSTE": "CROSSING SITE/WATER CROSSING", 
            "CSN": "CONSTRUCTION", 
            "CSNALH": "COMPACT OR WET SNOW (WITH OR WITHOUT ICE) COVERING AT LEAST ONE-HALF GROUND, BUT GROUND NOT COMPLETELY COVERED", 
            "CSNVEH": "CONSTRUCTION VEHICLE", 
            "CSS": "COMBAT SERVICE SUPPORT", 
            "CSSVEH": "COMBAT SERVICE SUPPORT VEHICLE", 
            "CSTHYD": "COASTAL HYDROGRAPHY", 
            "CSTLN": "COASTLINE", 
            "CSTSVL": "COASTAL SURVEILLANCE", 
            "CSV": "CREWED SPACE VEHICLE", 
            "CTDAPP": "CONTROLLED APPROACH", 
            "CTDINC": "CONTROLLED INTERCEPT", 
            "CTR": "SEARCH CENTER", 
            "CTRB": "CLUTTER (BOTTOM)", 
            "CTSHVY": "CONTINUOUS HEAVY", 
            "CTSLIT": "CONTINUOUS LIGHT", 
            "CTSMOD": "CONTINUOUS MODERATE", 
            "CTUR": "CONTOUR", 
            "CUDCOV": "CLOUD COVERAGE", 
            "CVL": "CIVIL", 
            "CVLAFF": "CIVIL AFFAIRS", 
            "CVLVEH": "CIVILIAN VEHICLE", 
            "CVP": "CIVILIAN COLLECTION POINT", 
            "CVY": "CAVALRY", 
            "CWSNLH": "COMPACT OR WET SNOW (WITH OR WITHOUT ICE) COVERING LESS THAN ONE-HALF OF GROUND", 
            "CYC": "CYCLONE CENTER", 
            "DA": "DEAD SPACE AREA (DA)", 
            "DAFF": "DIRECTION OF ATTACK FOR FEINT", 
            "DAFNC": "DOUBLE APRON FENCE", 
            "DAM": "DAM", 
            "DANHAZ": "DANGERS/HAZARDS", 
            "DAPP": "DOWNED AIRCREW PICKUP POINT", 
            "DATTMN": "DATA TRANSMISSION", 
            "DBLFNC": "DOUBLE FENCE", 
            "DBLSTD": "DOUBLE STRAND CONCERTINA", 
            "DBS": "DRIVE-BY SHOOTING", 
            "DBT": "MINE-NAVAL (DOUBTFUL)", 
            "DCDH2O": "DISCOLORED WATER", 
            "DCNPNT": "DECISION POINT", 
            "DCP": "DETAINEE COLLECTION POINT", 
            "DCPN": "DECEPTION", 
            "DCY": "DECOY", 
            "DD": "DESTROYER", 
            "DDCK": "DRYDOCK", 
            "DECON": "DECONTAMINATION", 
            "DECONP": "DECONTAMINATION (DECON) POINTS", 
            "DEF": "DEFENSE", 
            "DEFN": "MINE-NAVAL (DEFINITE)", 
            "DEMO": "DEMONSTRATION", 
            "DEN": "DENTAL", 
            "DFG": "DIRECT FIRE GUN", 
            "DFN": "DIRECTION FINDING", 
            "DFT": "BYPASS DIFFICULT", 
            "DFTY": "OBSTACLE BYPASS DIFFICULTY", 
            "DGOPN": "DRUG OPERATION", 
            "DGVEH": "DRUG VEHICLE", 
            "DHA": "DETAINEE HOLDING AREA", 
            "DICASS": "DIRECTIONAL COMMAND ACTIVE SONOBUOY SYSTEM(DICASS)", 
            "DIFAR": "DIRECTIONAL FREQUENCY ANALYZING AND RECORDING(DIFAR)", 
            "DIPPSN": "DIP POSITION", 
            "DIRATK": "DIRECTION OF ATTACK", 
            "DIV": "DIVISION", 
            "DLRP": "DLRP", 
            "DLT": "DEALT", 
            "DLY": "DELAY", 
            "DMA": "DECOY MINED AREA", 
            "DMAF": "DECOY MINED AREA, FENCED", 
            "DMD": "DISMOUNTED", 
            "DMY": "DUMMY (DECEPTION/DECOY)", 
            "DMYMD": "DUMMY MINEFIELD (DYNAMIC)", 
            "DMYMS": "DUMMY MINEFIELD (STATIC)", 
            "DOPN": "DOLPHIN", 
            "DPH": "DEPTH", 
            "DRCL": "DOSE RATE CONTOUR LINES", 
            "DRFT": "DRIFTER", 
            "DRG": "DREDGE", 
            "DRN": "DRONE (RPV/UAV)", 
            "DRPPNT": "DROP POINT", 
            "DRPZ": "DROP ZONE", 
            "DRT": "DISRUPT", 
            "DSA": "DIVISION (DSA)", 
            "DSTVES": "DISTRESSED VESSEL", 
            "DSTY": "DESTROY", 
            "DT/SD": "DUST OR SAND", 
            "DTDVL": "DUST DEVIL", 
            "DTHAC": "DITCHED AIRCRAFT", 
            "DTM": "DATUM", 
            "DVG": "DIVERGENCE", 
            "DVR": "DIVER (HARDTOP DIVER, SCUBA DIVER)", 
            "DVSN": "DIVERSIONS", 
            "DYN": "DYNAMIC DEPICTION", 
            "DYNPRO": "DYNAMIC PROCESSES", 
            "DZ": "DRIZZLE", 
            "DZR": "DOZER", 
            "EBB": "CURRENT FLOW - EBB", 
            "ECM": "ELECTRONIC COUNTERMEASURES (ECM/JAMMER)", 
            "ECRG": "ELECTRONIC RANGING", 
            "ECW": "ELECTRONIC WARFARE", 
            "EIEOB": "ESTIMATED ICE EDGE OR BOUNDARY", 
            "ELC": "ELECTRONIC", 
            "ELCSCG": "EVEN LAYER OF COMPACT OR WET SNOW COVERING GROUND COMPLETELY", 
            "ELDSCG": "EVEN LAYER OF LOOSE DRY SNOW COVERING GROUND COMPLETELY", 
            "ELP": "ELLIPSE", 
            "EM": "ELECTRO-MAGNETIC", 
            "EMP": "EMPLACED", 
            "EMTARA": "ENGAGEMENT AREA", 
            "ENCMT": "ENCIRCLEMENT", 
            "ENG": "ENGINEER", 
            "ENGEP": "ENGINEERING EQUIPMENT PRODUCTION", 
            "ENGVEH": "ENGINEER VEHICLE", 
            "ENTPNT": "ENTRY POINT", 
            "EOD": "EXPLOSIVE ORDINANCE DISPOSAL", 
            "EOP": "ELECTRO-OPTICAL", 
            "EOPI": "ELECTRO-OPTICAL INTERCEPT", 
            "EOTR": "EDDIES/OVERFALLS/TIDE RIPS", 
            "EPF": "ELECTRIC POWER FACILITY", 
            "EPWCP": "ENEMY PRISONER OF WAR (EPW) COLLECTION POINT", 
            "EPWHA": "ENEMY PRISONER OF WAR (EPW) HOLDING AREA", 
            "EQT": "EQUIPMENT", 
            "EQTMNF": "EQUIPMENT MANUFACTURE", 
            "EQTTRP": "DECON SITE/POINT (EQUIPMENT AND TROOPS)", 
            "ER": "EMERGENCY", 
            "ERHMR": "EARTHMOVER", 
            "ERHSVL": "EARTH SURVEILLANCE", 
            "ERP": "ENGINEER REGULATING POINT", 
            "ESM": "ELECTRONIC SURVEILLANCE MEASURES", 
            "ESTOF": "EARTHWORK, SMALL TRENCH OR FORTIFICATION", 
            "ESY": "BYPASS EASY", 
            "EW": "EARLY WARNING", 
            "EXCD": "ROADBLOCK COMPLETE (EXECUTED)", 
            "EXT": "TURBULENCE - EXTREME", 
            "EXTDWC": "EXTREMELY DRY WITH CRACKS", 
            "EXTN": "EXTORTION", 
            "EZ": "EXTRACTION ZONE (EZ)", 
            "FAADEZ": "FORWARD AREA AIR DEFENSE ZONE (FAADEZ)", 
            "FAC": "FACILITIES", 
            "FAOTP": "FALLOUT PRODUCING", 
            "FARP": "FORWARD ARMING AND REFUELING AREA (FARP)", 
            "FBG": "FLOEBERG", 
            "FC": "FUNNEL CLOUD (TORNADO/WATERSPOUT)", 
            "FCL": "FINAL COORDINATION LINE", 
            "FDDIST": "FOOD DISTRIBUTION", 
            "FEBA": "FORWARD EDGE OF BATTLE AREA (FEBA)", 
            "FEW": "FEW COVERAGE", 
            "FEWS": "FOXHOLE, EMPLACEMENT OR WEAPON SITE", 
            "FFA": "FIRE FREE AREA (FFA)", 
            "FFR": "FRIGATE/CORVETTE", 
            "FG": "FOG", 
            "FIN": "FINANCE", 
            "FIRCTL": "FIRE CONTROL", 
            "FIX": "FIX", 
            "FIXAVN": "FIXED WING AVIATION", 
            "FIXD": "FIXED WING", 
            "FIXPFD": "FIXED AND PREFABRICATED", 
            "FLDART": "FIELD ARTILLERY", 
            "FLGRD1": "FOUL GROUND", 
            "FLGRD2": "FOUL GROUND", 
            "FLGRD3": "FOUL GROUND", 
            "FLH": "FLASH (OPTICAL)", 
            "FLMTHR": "FLAME THROWER", 
            "FLOOD": "CURRENT FLOW - FLOOD", 
            "FLOT": "FORWARD LINE OF OWN TROOPS (FLOT)", 
            "FLT": "FLAT", 
            "FLTBD": "FLATBED TRUCK", 
            "FLTSUP": "FLEET SUPPORT (TENDER/TUG)", 
            "FLWASS": "FOLLOW AND ASSUME", 
            "FLWSUP": "FOLLOW AND SUPPORT", 
            "FNE": "FINE", 
            "FNESD": "FINE SAND", 
            "FNESLT": "FINE SILT", 
            "FOR": "FORCE", 
            "FOSF": "FOSSIL FUEL", 
            "FP": "FIRING POINT", 
            "FPF": "FINAL PROTECTIVE FIRE (FPF)", 
            "FRD": "FORD", 
            "FRDDFT": "FORD DIFFICULT", 
            "FRDESY": "FORD EASY", 
            "FRGS": "FRONTOGENESIS", 
            "FRGSRH": "FORAGING/SEARCHING", 
            "FRLS": "FRONTOLYSIS", 
            "FRMN": "FORMATION", 
            "FRNSYS": "FRONTAL SYSTEMS", 
            "FRT": "FORT", 
            "FRY": "FERRY", 
            "FRYCSG": "FERRY CROSSING", 
            "FRYTSP": "FERRY TRANSPORTER", 
            "FSA": "FIRE SUPPORT AREA (FSA)", 
            "FSCL": "FIRE SUPPORT COORDINATION LINE (FSCL)", 
            "FSG": "FISHING", 
            "FSGHBR": "FISHING HARBOR", 
            "FSH1": "FORESHORE", 
            "FSH2": "FORESHORE", 
            "FSH3": "FORESHORE", 
            "FSS": "FIRE SUPPORT STATION", 
            "FSTK1": "FISH STAKES/TRAPS/WEIRS", 
            "FSTK2": "FISH STAKES", 
            "FSTK3": "FISH STAKES/TRAPS/WEIRS", 
            "FSUPP": "FIRE SUPPORT", 
            "FTFDAR": "FORTIFIED AREA", 
            "FTFDLN": "FORTIFIED LINE", 
            "FTR": "FIGHTER", 
            "FU": "SMOKE", 
            "FWDCOM": "FORWARD COMMUNICATIONS", 
            "FWDOP": "FORWARD OBSERVER POSITION", 
            "FZDZ": "FREEZING DRIZZLE", 
            "FZLED": "FROZEN LEAD", 
            "FZLVL": "FREEZING LEVEL", 
            "FZPPN": "FREEZING/FROZEN PRECIPITATION", 
            "FZRA": "FREEZING RAIN", 
            "FZSNV": "FOG - FREEZING, SKY NOT VISIBLE", 
            "FZSV": "FOG - FREEZING, SKY VISIBLE", 
            "GAP": "GAP", 
            "GDD": "GUIDED MISSILE", 
            "GENARA": "GENERAL AREA", 
            "GLST": "GRAY LIST LOCATION", 
            "GLZGRD": "GLAZE (THIN ICE) ON GROUND", 
            "GNL": "GENERAL", 
            "GOVLDR": "GOVERNMENT LEADERSHIP", 
            "GPHY": "GEOPHYSICS/ACOUSTICS", 
            "GRD": "GROUND", 
            "GRDSM": "GROUND STATION MODULE", 
            "GRDSR": "GROUND SURVEILLANCE RADAR", 
            "GRDTRK": "GROUND TRACK", 
            "GRDVEH": "GROUND VEHICLE", 
            "GRDZRO": "GROUND ZERO", 
            "GREL": "GRENADE LAUNCHER", 
            "GRF": "GRAFITTI", 
            "GTL": "GENTLE", 
            "GUD": "GUARD", 
            "GUNUNT": "GUN UNIT", 
            "GVL": "GRAVEL", 
            "GWL": "GROWLER", 
            "H2O": "WATER", 
            "H2OCRT": "WATER CRAFT", 
            "H2OTRB": "WATER TURBULENCE", 
            "HAMEZ": "HIGH ALTITUDE MEZ", 
            "HAZ": "HAZARD", 
            "HAZMAT": "HAZARDOUS MATERIALS (HAZMAT)", 
            "HBR": "HARBOR (GENERAL)", 
            "HC": "HURRICANE/TYPHOON", 
            "HCNY": "HALTED CONVOY", 
            "HGH": "HIGH", 
            "HGHCTR": "HIGH PRESSURE CENTER", 
            "HGL": "HOLDING LINE", 
            "HGTFDG": "HEIGHT FINDING", 
            "HIDACZ": "HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)", 
            "HJKG": "HIJACKING", 
            "HL": "HAIL", 
            "HMAD": "H/MAD", 
            "HMG": "HEAVY MACHINE GUN", 
            "HOV": "HOVERCRAFT", 
            "HOW": "HOWITZER/GUN", 
            "HP": "HIDE POINT", 
            "HRE": "HORSE", 
            "HSP": "HOSPITAL", 
            "HSPSHP": "HOSPITAL SHIP", 
            "HTHP": "HOUSE-TO-HOUSE PROPAGANDA", 
            "HUM": "RIDGES OR HUMMOCKS", 
            "HVY": "HEAVY", 
            "HWFNC": "HIGH WIRE FENCE", 
            "HWK": "HAWK", 
            "HYDGRY": "HYDROGRAPHY", 
            "HZ": "HAZE", 
            "IB": "ICEBERG", 
            "IC": "ICE CRYSTALS (DIAMOND DUST)", 
            "ICG": "ICING", 
            "ICN": "ICE CONCENTRATION", 
            "ID": "ICE DRIFT (DIRECTION)", 
            "IDFF": "IDENTIFICATION FRIEND/FOE (INTERROGATOR)", 
            "IEOBFR": "ICE EDGE OR BOUNDARY FROM RADAR", 
            "IF": "ICE FREE", 
            "IFF": "IFF (TRANSPONDER)", 
            "IFR": "INSTRUMENT FLIGHT RULE (IFR)", 
            "II": "ICE ISLAND", 
            "IMP": "BYPASS IMPOSSIBLE", 
            "IMTBUR": "IMPACT BURIAL", 
            "IMTPNT": "IMPACT POINT", 
            "INC": "INTERCEPT", 
            "INCR": "INTERCEPTOR", 
            "INF": "INFANTRY", 
            "INFFV": "INFANTRY FIGHTING VEHICLE", 
            "INFNLE": "INFILTRATION LANE", 
            "INMHVY": "INTERMITTENT HEAVY", 
            "INMLIT": "INTERMITTENT LIGHT", 
            "INMMOD": "INTERMITTENT MODERATE", 
            "INS": "INSTALLATION", 
            "INT": "INTELLIGENCE (OCEANOGRAPHIC, AGI)", 
            "INTGN": "INTERROGATION", 
            "INTMR": "INTERMEDIATE RANGE", 
            "IRR": "IRREGULAR", 
            "ISB": "ISOBAR - SURFACE", 
            "ISD": "ISODROSOTHERM", 
            "ISF": "INTERNAL SECURITY FORCES", 
            "ISH": "ISOTACH", 
            "ISL": "ISOLATE", 
            "ISND": "ISLAND", 
            "ISP": "ISOPLETHS", 
            "IST": "ISOTHERM", 
            "ISTB": "INSTABILITY LINE", 
            "ISYS": "ICE SYSTEMS", 
            "ITCZ": "INTER-TROPICAL CONVERGANCE ZONE", 
            "ITD": "INTER-TROPICAL DISCONTINUITY", 
            "ITDT": "INTERDICT", 
            "ITEST": "ICE THICKNESS (ESTIMATED)", 
            "ITM": "ITEMS", 
            "ITOBS": "ICE THICKNESS (OBSERVED)", 
            "IWU": "INFORMATION WARFARE UNIT", 
            "JAG": "JUDGE ADVOCATE GENERAL (JAG)", 
            "JBB": "JAMMED BRASH BARRIER", 
            "JIB": "JOINT INFORMATION BUREAU (JIB)", 
            "JINTCT": "JOINT INTELLIGENCE CENTER", 
            "JMG": "JAMMING", 
            "JTSM": "JET STREAM", 
            "KDNG": "KIDNAPPING", 
            "KGP": "KINGPIN", 
            "KLP1": "KELP/SEAWEED", 
            "KLP2": "KELP/SEAWEED", 
            "KLP3": "KELP/SEAWEED", 
            "KNIVEH": "KNOWN INSURGENT VEHICLE", 
            "LAARA": "LIMITED ACCESS AREA", 
            "LAMEZ": "LOW ALTITUDE MEZ", 
            "LANE": "LANE", 
            "LAR": "LIGHT ARMORED RECONNAISSNACE (LAR)", 
            "LARMVH": "LIGHT ARMORED VEHICLE", 
            "LAWENU": "LAW ENFORCEMENT UNIT", 
            "LAWENV": "LAW ENFORCEMENT VESSEL", 
            "LBR": "LABOR", 
            "LCCP": "LARGE COMMUNICATION CONFIGURED PACKAGE (LCCP)", 
            "LCCTRK": "LIMITED CROSS-COUNTRY TRUCK", 
            "LCK": "LOCK", 
            "LCON": "LOST CONTACT", 
            "LD": "LINE OF DEPARTURE", 
            "LDGLNE": "LEADING LINE", 
            "LDLC": "LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)", 
            "LDNCGC": "LOOSE DRY DUST OR SAND NOT COVERING GROUND COMPLETELY", 
            "LDSALH": "LOOSE DRY SNOW COVERING AT LEAST ONE-HALF GROUND, BUT GROUND NOT COMPLETELY COVERED", 
            "LDSNLH": "LOOSE DRY SNOW COVERING LESS THAN ONE-HALF OF GROUND", 
            "LDY": "LAUNDRY/BATH", 
            "LED": "LEAD", 
            "LEN": "LARGE EXTENSION NODE", 
            "LESCRT": "LEISURE CRAFT", 
            "LIT": "LIGHT", 
            "LITHSE": "LIGHTHOUSE", 
            "LITLNE": "LIGHT LINE", 
            "LITMOD": "DUST/SAND STORM - LIGHT TO MODERATE", 
            "LITVES": "LIGHT VESSEL/LIGHTSHIP", 
            "LLTR": "LOW LEVEL TRANSIT ROUTE (LLTR)", 
            "LMG": "LIGHT MACHINE GUN", 
            "LMT": "LIMITS", 
            "LMTADV": "LIMIT OF ADVANCE", 
            "LND": "LAND", 
            "LNDCRT": "LANDING CRAFT", 
            "LNDMNE": "LAND MINES", 
            "LNDPLC": "LANDING PLACE", 
            "LNDRNG": "LANDING RING", 
            "LNDSHP": "LANDING SHIP", 
            "LNDSUP": "LANDING SUPPORT", 
            "LNE": "LINE", 
            "LNGR": "LONG RANGE", 
            "LNKUPT": "LINKUP POINT", 
            "LNRTGT": "LINEAR TARGET", 
            "LOC": "LINE OF CONTACT", 
            "LOCAT": "LOCATIONS", 
            "LOFAR": "LOW FREQUENCY ANALYZING AND RECORDING (LOFAR)", 
            "LORO": "LIMIT OF RADAR OBSERVATION", 
            "LOU": "LIMIT OF UNDERCAST", 
            "LOVO": "LIMIT OF VISUAL OBSERVATION", 
            "LOWCTR": "LOW PRESSURE CENTER", 
            "LP": "LAUNCH POINT", 
            "LPC": "LIQUID PRECIPITATION - CONVECTIVE", 
            "LPNCI": "LIQUID PRECIPITATION - NON-CONVECTIVE CONTINUOUS OR INTERMITTENT", 
            "LRP": "LOGISTICS RELEASE POINT (LRP)", 
            "LRS": "LONG RANGE SURVEILLANCE (LRS)", 
            "LSR": "LASER", 
            "LSTGT": "LINEAR SMOKE TARGET", 
            "LTA": "LIGHTER THAN AIR", 
            "LTG": "LIGHTNING", 
            "LTL": "LESS THAN LETHAL", 
            "LW": "LOW", 
            "LWFNC": "LOW WIRE FENCE", 
            "LZ": "LANDING ZONE (LZ)", 
            "MAINT": "MAINTENANCE", 
            "MANATK": "MAIN ATTACK", 
            "MAR": "MARINE", 
            "MARLFE": "MARINE LIFE", 
            "MARTAR": "MARITIME AREA", 
            "MARTLB": "MARITIME LIMIT BOUNDARY", 
            "MCC": "MOVEMENT CONTROL CENTER(MCC)", 
            "MCLST": "MINE CLUSTER", 
            "MCMDRN": "MCM DRONE", 
            "MCMSUP": "MCM SUPPORT", 
            "MCNY": "MOVING CONVOY", 
            "MCP": "MAINTENANCE COLLECTION POINT", 
            "MCT": "MERCHANT", 
            "MCVEH": "MINE CLEARING VEHICLE", 
            "MDM": "MEDIUM", 
            "MDMSD": "MEDIUM SAND", 
            "MDMSLT": "MEDIUM SILT", 
            "MECH": "MECHANIZED", 
            "MED": "MEDICAL", 
            "MEDF": "MEDICAL FACILITY", 
            "MEDTF": "MEDICAL TREATMENT FACILITY", 
            "MEDV": "MEDEVAC", 
            "METO": "METEOROLOGICAL", 
            "MEZ": "MISSILE ENGAGEMENT ZONE (MEZ)", 
            "MFN": "MULTI-FUNCTION", 
            "MIL": "MILITARY", 
            "MILBF": "MILITARY BASE/FACILITY", 
            "MILINT": "MILITARY INTELLIGENCE", 
            "MILP": "MILITARY POLICE", 
            "MILVP": "MILITARY VEHICLE PRODUCTION", 
            "MIST": "MIST", 
            "MIWBC": "MIW BOTTOM CATEGORY", 
            "MIWBS": "MIW-BOTTOM SEDIMENTS", 
            "MIWBT": "MIW BOTTOM TYPE", 
            "MIX": "MIXED ICING", 
            "ML": "MINE LAYING", 
            "MLDCGC": "MODERATE/THICK LOOSE DRY DUST OR SAND COVERING GROUND COMPLETELY", 
            "MLVEH": "MINE LAYING VEHICLE", 
            "MMD": "MAN-MADE STRUCTURES", 
            "MMF": "MILITARY MATERIEL FACILITY", 
            "MNDARA": "MINED AREA", 
            "MNE": "MINE", 
            "MNECM": "MINE COUNTERMEASURES", 
            "MNEFLD": "MINEFIELDS", 
            "MNEHNT": "MINEHUNTER", 
            "MNELYR": "MINELAYER", 
            "MNENAV": "MINE-NAVAL", 
            "MNESWE": "MINESWEEPER", 
            "MNEWBD": "MINE WARFARE BOTTOM DESCRIPTORS", 
            "MNEWV": "MINE WARFARE VESSEL", 
            "MNT": "MOUNTAIN", 
            "MNTWAV": "MOUNTAIN WAVES", 
            "MNY": "MANY ICEBERGS", 
            "MNYBB": "MANY BERGY BITS", 
            "MNYGNL": "MANY ICEBERGS - GENERAL", 
            "MNYGWL": "MANY GROWLERS", 
            "MOBSU": "MOBILITY/SURVIVABILITY", 
            "MOD": "MODERATE", 
            //"MODHVY": "FREEZING DRIZZLE - MODERATE/HEAVY", 
            //"MODHVY": "FREEZING RAIN - MODERATE/HEAVY", 
            //"MODHVY": "HAIL - MODERATE/HEAVY NOT ASSOCIATED WITH THUNDER", 
            "MODHVY": "RAIN SHOWERS - MODERATE/HEAVY", 
            //"MODHVY": "SNOW SHOWERS - MODERATE/HEAVY", 
            "MOOTW": "MILITARY OPERATIONS OTHER THAN WAR (MOOTW)", 
            "MORT": "MORTAR", 
            "MOT": "MOTORIZED", 
            "MPOFI": "MELT PUDDLES OR FLOODED ICE", 
            "MRK": "MARKER", 
            "MRL": "MULTIPLE ROCKET LAUNCHER", 
            "MRR": "MINIMUM RISK ROUTE (MRR)", 
            "MRSH": "MARSHALL", 
            "MRSPD": "MULTI ROCKET SELF-PROPELLED", 
            "MRTOW": "MULTI ROCKET TOWED", 
            "MRTRK": "MULTI ROCKET TRUCK", 
            "MSDZ": "MINIMUM SAFE DISTANCE ZONES", 
            "MSE": "MULTIPLE SUBSCRIBER ELEMENT", 
            "MSL": "MISSILE", 
            "MSLAQ": "MISSILE ACQUISITION", 
            "MSLDL": "MISSILE DOWNLINK", 
            "MSLGDN": "MISSILE GUIDANCE", 
            "MSLIF": "MISSILE IN FLIGHT", 
            "MSLL": "MISSILE LAUNCHER", 
            "MSLPNT": "MSL DETECT POINT", 
            "MSLTRK": "MISSILE TRACKING", 
            "MSRUT": "MAIN SUPPLY ROUTE", 
            "MSSP": "MISSILE & SPACE SYSTEM PRODUCTION", 
            "MTRY": "MORTUARY/GRAVES REGISTRY", 
            "MUD": "MUD", 
            "MVB": "MOVEABLE", 
            "MVBPFD": "MOVEABLE AND PREFABRICATED", 
            "MVFR": "MARGINAL VISUAL FLIGHT RULE (MVFR)", 
            "MWR": "MORALE, WELFARE, RECREATION (MWR)", 
            "NAI": "NAMED AREA OF INTEREST (NAI)", 
            "NAV": "NAVAL", 
            "NAVGRP": "NAVY GROUP", 
            "NAVREF": "NAV REFERENCE", 
            "NAVTF": "NAVY TASK FORCE", 
            "NAVTG": "NAVY TASK GROUP", 
            "NAVTU": "NAVY TASK UNIT", 
            "NBC": "NUCLEAR, BIOLOGICAL AND CHEMICAL", 
            "NBCEQT": "NBC EQUIPMENT", 
            "NBCOP": "NBC OBSERVATION POST (DISMOUNTED)", 
            "NCBTT": "NONCOMBATANT", 
            "NDGZ": "NUCLEAR DETINATIONS GROUND ZERO", 
            "NENY": "NUCLEAR ENERGY", 
            "NEUT": "NEUTRALIZE", 
            "NFA": "NO-FIRE AREA (NFA)", 
            "NFL": "NO-FIRE LINE (NFL)", 
            "NMIL": "NON-MILITARY", 
            "NMP": "NUCLEAR MATERIAL PRODUCTION", 
            "NMS": "NUCLEAR MATERIAL STORAGE", 
            "NODAT": "NO DATA", 
            "NODCTR": "NODE CENTER", 
            "NPRN": "NUCLEAR PROPULSION", 
            "NPT": "NUCLEAR PLANT", 
            "NSUB": "NON-SUBMARINE", 
            "NUC": "NUCLEAR", 
            "NUCTGT": "NUCLEAR TARGET", 
            "NVGL": "NAVIGATIONAL", 
            "OBJ": "OBJECTIVE", 
            "OBSEFT": "OBSTACLE EFFECT", 
            "OBSPST": "OBSERVATION POST/OUTPOST", 
            "OBST": "OBSTACLES", 
            "OBSTBP": "OBSTACLE BYPASS", 
            "OCA": "OCEANIC", 
            "OCC": "OCCUPY", 
            "OCD": "OCCLUDED FRONT", 
            "OCNGRY": "OCEANOGRAPHY", 
            "OD": "OPERATOR-DEFINED", 
            "ODFF": "OPERATOR-DEFINED FREEFORM", 
            "OFA": "OBSTACLE FREE AREA", 
            "OFF": "OFFENSE", 
            "OIEOB": "OBSERVED ICE EDGE OR BOUNDARY", 
            "OITI": "OPENINGS IN THE ICE", 
            "OLOS": "OMNI-LINE-OF-SIGHT (LOS)", 
            "OLR": "OILER/TANKER", 
            "OLRG": "OIL/GAS RIG", 
            "OLRGFD": "OIL/GAS RIG FIELD", 
            "OPDECN": "DECON SITE/POINT (OPERATIONAL DECONTAMINATION)", 
            "OPN": "OPERATIONS", 
            "ORA": "OBSTACLE RESTRICTED AREA", 
            "ORD": "ORDNANCE", 
            "OSLF1": "OFFSHORE LOADING FACILITY", 
            "OSLF2": "OFFSHORE LOADING FACILITY", 
            "OSLF3": "OFFSHORE LOADING FACILITY", 
            "OTH": "OTHER", 
            "OVC": "OVERCAST COVERAGE", 
            "OWN": "OWN TRACK", 
            "PAA": "POSITION AREA FOR ARTILLERY (PAA)", 
            "PAT": "PATROL", 
            "PATG": "PATROLLING", 
            "PATT": "PATRIOT", 
            "PBL": "PEBBLES", 
            "PBLSHE": "PEBBLES, SHELLS", 
            "PBNO": "PREPARED BUT NOT OCCUPIED", 
            "PBX": "PENETRATION BOX", 
            "PDF": "PRINCIPAL DIRECTION OF FIRE (PDF)", 
            "PDMIC": "PREDOMINATELY ICE COVERED", 
            "PE": "ICE PELLETS (SLEET)", 
            "PERSVC": "PERSONNEL SERVICES", 
            "PF": "PROCESSING FACILITY", 
            "PGO": "PETROLEUM/GAS/OIL", 
            "PHELNE": "PHASE LINE", 
            "PHG": "PHOTOGRAPHIC", 
            "PHOSWT": "TELEPHONE SWITCH", 
            "PIM": "PIM", 
            "PIPNT": "PREDICTED IMPACT POINT", 
            "PIW": "PERSON IN WATER", 
            "PKAN": "PACK ANIMAL(S)", 
            "PKT": "PICKET", 
            "PLD": "PROBABLE LINE OF DEPLOYMENT (PLD)", 
            "PLE": "PILE/PILING/POST", 
            "PLND": "PLANNED", 
            "PLT": "WIND PLOT", 
            "PNE": "PENETRATE", 
            "PNT": "POINT", 
            "PNTA": "POINT A", 
            "PNTD": "POINT OF DEPARTURE", 
            "PNTINR": "POINT OF INTEREST", 
            "PNTQ": "POINT Q", 
            "PNTR": "POINT R", 
            "PNTX": "POINT X", 
            "PNTY": "POINT Y", 
            "POUTAI": "PRECIPITATION OF UNKNOWN TYPE AND INTENSITY", 
            "PPELNE": "PIPELINES/PIPE", 
            "PRH1": "PERCHES/STAKES", 
            "PRH2": "PERCHES/STAKES", 
            "PRH3": "PERCHES/STAKES", 
            "PRS": "PRESSURE SYSTEMS", 
            "PRT": "PORTS", 
            "PRTHBR": "PORTS AND HARBORS", 
            "PSG": "PASSENGER", 
            "PSNG": "POISONING", 
            "PSSPNT": "PASSAGE POINT", 
            "PST": "POSTAL", 
            "PSY": "PSYCHOLOGICAL", 
            "PSYOP": "PSYCHOLOGICAL OPERATIONS (PSYOP)", 
            "PTGT": "POINT/SINGLE TARGET", 
            "PTHY": "FOG - PATCHY", 
            "PTNCTR": "PATTERN CENTER", 
            "PTPLOS": "POINT-TO-POINT LINE-OF-SIGHT (LOS)", 
            "PUBAFF": "PUBLIC AFFAIRS", 
            "PUP": "PULL-UP POINT (PUP)", 
            "PUR": "PURIFICATION", 
            "PWQ": "PIER/WHARF/QUAY", 
            "PWS": "PUBLIC WATER SERVICES", 
            "PZ": "PICKUP ZONE (PZ)", 
            "QLFYTM": "QUALIFYING TERMS", 
            "RA": "RAIN", 
            "RAD": "RADAR", 
            "RADA": "RADIOACTIVE AREA", 
            "RALRD": "RAILROAD", 
            "RAMPAW": "RAMP (ABOVE WATER)", 
            "RAMPBW": "RAMP (BELOW WATER)", 
            "RASN": "RAIN AND SNOW MIXED", 
            "RASWR": "RAIN SHOWERS", 
            "RAYPNT": "RALLY POINT", 
            "RCBB": "ROADBLOCKS, CRATERS, AND BLOWN BRIDGES", 
            "RCK": "ROCK", 
            "RCKAWD": "ROCK AWASHED", 
            "RCKSBM": "ROCK SUBMERGERED", 
            "RCMT": "RECRUITMENT", 
            "RCY": "RECOVERY", 
            "RDGAXS": "RIDGE AXIS", 
            "RDOUNT": "RADIO UNIT", 
            "RDSLIT": "RAIN OR DRIZZLE AND SNOW - LIGHT", 
            "RDSMH": "RAIN OR DRIZZLE AND SNOW - MODERATE/HEAVY", 
            "RDV": "RENDEZVOUS", 
            "RECEQP": "RECON EQUIPPED", 
            "RECL": "RECOILLESS", 
            "RECON": "RECONNAISSANCE", 
            "REEF": "REEF", 
            "REEVNT": "RELEASE EVENTS", 
            "REFPNT": "REFERENCE POINT", 
            "REL": "RELEASE LINE", 
            "RELG": "RELIGIOUS/CHAPLAIN", 
            "RELPNT": "RELEASE POINT", 
            "RFA": "RESTRICTIVE FIRE AREA (RFA)", 
            "RFE": "REFUEL", 
            "RFG": "REFUGEES", 
            "RFL": "RESTRICTIVE FIRE LINE (RFL)", 
            "RFT": "RAFT SITE", 
            "RFTG": "RAFTING", 
            "RGH": "ROUGH", 
            "RGR": "RANGER", 
            "RHA": "REFUGEE HOLDING AREA", 
            "RHD": "RAILHEAD", 
            "RHU": "REPLACEMENT HOLDING UNIT (RHU)", 
            "RIF": "RIFLE", 
            "RIFWPN": "RIFLE/AUTOMATIC WEAPON", 
            "RIME": "RIME ICING", 
            "RIP": "RELIEF IN PLACE (RIP)", 
            "RIV": "RIVERINE", 
            "RLY": "RELAY", 
            "RMP": "RAW MATERIAL PRODUCTION/STORAGE", 
            "RO": "RANGE ONLY (RO)", 
            "ROC": "ROCKET", 
            "ROM": "REFUEL ON THE MOVE (ROM) POINT", 
            "RORO": "ROLL ON/ROLL OFF", 
            "ROT": "ROTARY WING", 
            "ROZ": "RESTRICTED OPERATIONS ZONE (ROZ)", 
            "RP": "RELOAD POINT", 
            "RPH": "REPLENISH", 
            "RRRP": "REARM, REFUEL AND RESUPPLY POINT", 
            "RSA": "REGIMENTAL (RSA)", 
            "RSC": "RESCUE", 
            "RSDARA": "RESTRICTED AREA", 
            "RTE": "ROUTE", 
            "RTG": "RECTANGULAR", 
            "RTGTGT": "RECTANGULAR TARGET", 
            "RTM": "RETIREMENT", 
            "RTN": "RETAIN", 
            "SA": "SEA ANOMALY (WAKE, CURRENT, KNUCKLE)", 
            "SAAFR": "STANDARD-USE ARMY AIRCRAFT FLIGHT ROUTE (SAAFR)", 
            "SAFE": "EXPLOSIVES, STATE OF READINESS 1 (SAFE)", 
            "SAFHSE": "SAFE HOUSE", 
            "SAM": "SURFACE TO AIR MISSILE (SAM)", 
            "SAR": "SEARCH AND RESCUE", 
            "SAT": "SATELLITE", 
            "SATDL": "SATELLITE DOWN-LINK", 
            "SATUL": "SATELLITE UP-LINK", 
            "SBM": "WRECK (SUBMERGED)", 
            "SBMCRB": "SUBMERGED CRIB", 
            "SBRSOO": "SEABED ROCK/STONE, OBSTACLE, OTHER", 
            "SBSM": "SUBSURFACE TO SURFACE MISSILE (S/SSM)", 
            "SBSUF": "SUBSURFACE TRACK", 
            "SBT": "SPECIAL BOAT", 
            "SC": "SNOW COVER", 
            "SCE": "SECURE", 
            "SCGC": "SNOW COVERING GROUND COMPLETELY; DEEP DRIFTS", 
            "SCM": "SCM", 
            "SCN": "SCREEN", 
            "SCP": "SURVEY CONTROL POINT", 
            "SCR": "SECTOR", 
            "SCT": "SCATTERED COVERAGE", 
            "SCUT": "SCOUT", 
            "SD": "SAND", 
            "SD&SHE": "SAND AND SHELLS", 
            "SEAL": "SEAL", 
            "SEC": "SECURITY", 
            "SECPOL": "SECURITY POLICE (AIR)", 
            "SEMI": "SEMI", 
            "SEN": "SMALL EXTENSION NODE", 
            "SFP": "SUPPORT BY FIRE POSITION", 
            "SG": "SNOW GRAINS", 
            "SGTGT": "SERIES OR GROUP OF TARGETS", 
            "SHA": "SHEAR LINE", 
            "SHAZ": "SHEARING OR SHEAR ZONE", 
            "SHE": "SHELL", 
            "SHETKG": "SHELL TRACKING", 
            "SHPCSN": "SHIP CONSTRUCTION", 
            "SHRLNE": "SHORELINE PROTECTION", 
            "SHRPAT": "SHORE PATROL", 
            "SHTR": "SHORT RANGE", 
            "SHWCTS": "FOG - SHALLOW CONTINUOUS", 
            "SHWPTH": "FOG - SHALLOW PATCHES", 
            "SI": "SEA ICE", 
            "SIGINC": "SIGNAL INTERCEPT", 
            "SIGINT": "SIGNALS INTELLIGENCE", 
            "SIGSUP": "SIGNAL SUPPORT", 
            "SIGUNT": "SIGNAL UNIT", 
            "SKC": "CLEAR SKY", 
            "SKEIP": "STRIKE IP", 
            "SKYOBD": "FOG - SKY OBSCURED", 
            "SKYVSB": "FOG - SKY VISIBLE", 
            "SLDRCK": "SOLID ROCK", 
            "SLM": "SURFACE LAUNCHED MISSILE", 
            "SLP": "SUPPLY", 
            "SLPRUT": "SUPPLY ROUTES", 
            "SLT": "SILT", 
            "SMDCY": "SEA MINE DECOY", 
            "SMF": "SEA MINE (FLOATING)", 
            "SMG": "SEA MINE (GROUND)", 
            "SMH": "SMOOTH", 
            "SMK": "SMOKE", 
            "SMKDEC": "SMOKE/DECON", 
            "SML": "SEA MINE-LIKE", 
            "SMLNE": "STREAM LINE", 
            "SMM": "SEA MINE (MOORED)", 
            "SMNE": "SEA MINE", 
            "SMOP": "SEA MINE (OTHER POSITION)", 
            "SN": "SNOW", 
            "SNAG": "SNAGS/STUMPS", 
            "SNBY": "SONOBUOY", 
            "SND": "SOUND", 
            "SNDG": "SOUNDINGS", 
            "SNG": "SINGLE CONCERTINA", 
            "SNGFNC": "SINGLE FENCE", 
            "SNK": "SINKER", 
            "SNS": "SENSOR", 
            "SNSZ": "SENSOR ZONE", 
            "SOF": "SPECIAL OPERATIONS FORCES (SOF)", 
            "SOFUNT": "SPECIAL OPERATIONS FORCES (SOF) UNIT", 
            "SOP": "SENSOR OUTPOST/LISTENING POST (OP/LP)", 
            "SP": "SEAPORT/NAVAL BASE", 
            "SPC": "SPACE", 
            "SPD": "SELF-PROPELLED", 
            "SPDTRK": "SELF-PROPELLED TRACKED", 
            "SPDWHD": "SELF-PROPELLED WHEELED", 
            "SPG": "SNIPING", 
            "SPL": "SPECIAL", 
            "SPLPNT": "SPECIAL POINT", 
            "SPOD": "SPOD/SPOE", 
            "SPT": "SUPPLY POINTS", 
            "SPY": "SPY", 
            "SQL": "SQUALL", 
            "SRH": "SEARCH", 
            "SRHARA": "SEARCH AREA/RECONNAISSANCE AREA", 
            "SRL": "SINGLE ROCKET LAUNCHER", 
            "SRSPD": "SINGLE ROCKET SELF-PROPELLED", 
            "SRTOW": "SINGLE ROCKET TOWED", 
            "SRTRK": "SINGLE ROCKET TRUCK", 
            "SRUF": "SERVICE, RESEARCH, UTILITY FACILITY", 
            "SSH": "SERVICE & SUPPORT HARBOR (YARDCRAFT, BARGE, HARBOR, TUG)", 
            "SSL": "SEVERE SQUALL LINE", 
            "SSM": "SURFACE TO SURFACE MISSILE (SSM)", 
            "SSSNR": "SPECIAL SSNR", 
            "SST": "SPACE STATION", 
            "SSUBSR": "SEA SUBSURFACE RETURNS", 
            "SSUF": "SEA SURFACE TRACK", 
            "SSWR": "SNOW SHOWERS", 
            "STAT": "STATIONARY FRONT", 
            "STC": "STATIC DEPICTION", 
            "STG": "STINGER", 
            "STGC": "STRATEGIC", 
            "STMS": "STORMS", 
            "STN": "STATION", 
            "STNE": "STONES", 
            "STOG": "STATE OF THE GROUND", 
            "STOPO": "SKY TOTALLY OR PARTIALLY OBSCURED", 
            "STP": "STEEP", 
            "STRGPT": "STRONG POINT", 
            "STRPNT": "START POINT", 
            "SU": "SURVIVABILITY", 
            "SUB": "SUBMARINE", 
            "SUBCBL": "SUBMARINE CABLE", 
            "SUF": "SURF-SURF (SS)", 
            "SUFDRY": "SURFACE DRY WITHOUT CRACKS OR APPRECIABLE DUST OR LOOSE SAND", 
            "SUFFLD": "SURFACE FLOODED", 
            "SUFFZN": "SURFACE FROZEN", 
            "SUFMST": "SURFACE MOIST", 
            "SUFSHL": "SURFACE SHELTER", 
            "SUFSRH": "SURFACE SEARCH", 
            "SUFWET": "SURFACE WET, STANDING WATER IN SMALL OR LARGE POOLS", 
            "SUP": "SUPPORT", 
            "SUPARS": "SUPPORT AREAS", 
            "SUPATK": "SUPPORTING ATTACK", 
            "SUPPLY": "QUARTERMASTER (SUPPLY)", 
            "SUV": "SPORT UTILITY VEHICLE (SUV)", 
            "SVL": "SURVEILLANCE", 
            "SVR": "SEVERE", 
            "SW": "SEAWALL", 
            "SWO": "SASTRUGI (WITH ORIENTATION)", 
            "SWPARA": "SWEPT AREA", 
            "SWRLIT": "RAIN AND SNOW SHOWERS - LIGHT", 
            "SWRMOD": "RAIN AND SNOW SHOWERS - MODERATE/HEAVY", 
            "SYM": "CLOUD COVERAGE SYMBOLS", 
            "SZE": "SEIZE", 
            "TAC": "TACTICAL", 
            "TACEXP": "TACTICAL EXPLOIT", 
            "TACGRP": "TACTICAL GRAPHICS", 
            "TACSAT": "TACTICAL SATELLITE", 
            "TAI": "TARGETED AREA OF INTEREST (TAI)", 
            "TAK": "TANKING", 
            "TANK": "TANK", 
            "TARP": "PSYOP (TV AND RADIO PROPAGANDA)", 
            "TBA": "TARGET BUILD-UP AREA (TBA)", 
            "TCF": "TELECOMMUNICATIONS FACILITY", 
            "TCN": "TACAN", 
            "TCP": "TRAFFIC CONTROL POST (TCP)", 
            "TDECUR": "TIDE AND CURRENT", 
            "TDEDP": "TIDE DATA POINT", 
            "TDEG": "TIDE GAUGE", 
            "TDTSM": "ANTITANK OBSTACLES: TETRAHEDRONS, DRAGONS TEETH, AND OTHER SIMILAR OBSTACLES", 
            "TELAR": "TELAR", 
            "TGT": "TARGET", 
            "TGTAQ": "TARGET ACQUISITION", 
            "TGTAQZ": "TARGET ACQUISTION ZONES", 
            "TGTGUT": "TARGETING UNIT", 
            "TGTILL": "TARGET ILLUMINATOR", 
            "TGTREF": "TARGET REFERENCE", 
            "TGTTRK": "TARGET TRACKING", 
            "THK": "THICKNESS", 
            "THT": "THEATER", 
            "TKD": "TRACKED", 
            "TLAR": "TLAR", 
            "TLDCGC": "THIN LOOSE DRY DUST OR SAND COVERING GROUND COMPLETELY", 
            "TM": "TRAILER MOUNTED", 
            "TMC": "TOMCAT", 
            "TMDU": "THEATER MISSILE DEFENSE UNIT", 
            "TNE": "TRAINER", 
            "TNK": "TANKER", 
            "TOPFTR": "TOPOGRAPHICAL FEATURES", 
            "TOR": "RAIN SHOWERS - TORRENTIAL", 
            "TOW": "TOWED", 
            "TOWTRK": "TOW TRUCK", 
            "TOWVES": "TOWING VESSEL", 
            "TPD": "TORPEDO", 
            "TPLSYS": "TROPICAL STORM SYSTEMS", 
            "TPSSCT": "TROPOSPHERIC SCATTER", 
            "TPT": "TRANSPORTATION", 
            "TRB": "TURBULENCE", 
            "TRF": "TECHNOLOGICAL RESEARCH FACILITY", 
            "TRGARA": "TRAINING AREA", 
            "TRGH": "DECON SITE/POINT (THOROUGH DECONTAMINATION)", 
            "TRIPWR": "TRIP WIRE", 
            "TRISTD": "TRIPLE STRAND CONCERTINA", 
            "TRK": "TRACK", 
            "TRKMV": "TRUCK MOUNTED WITH VOLCANO", 
            "TRNLCO": "TRAIN LOCOMOTIVE", 
            "TROPDN": "TROPICAL DEPRESSION", 
            "TROPHG": "TROPOPAUSE HIGH", 
            "TROPLV": "TROPOPAUSE LEVEL", 
            "TROPLW": "TROPOPAUSE LOW", 
            "TROPSM": "TROPICAL STORM", 
            "TRP": "DECON SITE/POINT (TROOPS)", 
            "TRUAXS": "TROUGH AXIS", 
            "TRW": "TRAWLER", 
            //"TS": "THUNDERSTORM - NO PRECIPITATION", 
            "TS": "THUNDERSTORMS", 
            "TSHVNH": "THUNDERSTORM HEAVY WITH RAIN/SNOW - NO HAIL", 
            //"TSHVWH": "THUNDERSTORM HEAVY - WITH HAIL", 
            "TSK": "TASKS", 
            "TSLMNH": "THUNDERSTORM LIGHT TO MODERATE WITH RAIN/SNOW - NO HAIL", 
            "TSLMWH": "THUNDERSTORM LIGHT TO MODERATE - WITH HAIL", 
            "TSPF": "TRANSPORT FACILITY", 
            "TSWADL": "TROPICAL STORM WIND AREAS AND DATE/TIME LABELS", 
            "TTP": "TRAILER TRANSFER POINT", 
            "TTYCTR": "TELETYPE CENTER", 
            "TUG": "TUG", 
            "TUR": "TURN", 
            "TVAR": "TARGET VALUE AREA (TVAR)", 
            "UAV": "UNMANNED AERIAL VEHICLE", 
            "UAVR": "UNMANNED AERIAL VEHICLE (UAV) ROUTE", 
            "UCOV": "WRECK (UNCOVERS)", 
            "UGDSHL": "UNDERGROUND SHELTER", 
            "UH2": "UNDERWATER", 
            "UH2DAN": "UNDERWATER DANGER/HAZARD", 
            "UH2DCY": "UNDERWATER DECOY", 
            "UH2DML": "UNDERWATER DEMOLITION TEAM", 
            "UH2WPN": "UNDERWATER WEAPON", 
            "ULCSCG": "UNEVEN LAYER OF COMPACT OR WET SNOW COVERING GROUND COMPLETELY", 
            "ULDSCG": "UNEVEN LAYER OF LOOSE DRY SNOW COVERING GROUND COMPLETELY", 
            "UMC": "UNIT MAINTENANCE COLLECTION POINT", 
            "UNK": "UNKNOWN", 
            "UNT": "UNIT", 
            "UPP": "UPPER", 
            "USP": "UNSPECIFIED", 
            "USPMNE": "UNSPECIFIED MINE", 
            "USW": "UNDER SEA WARFARE", 
            "UTY": "UTILITY", 
            "UTYVEH": "UTILITY VEHICLE", 
            "UUV": "UNMANNED UNDERWATER VEHICLE (UUV)", 
            "UWRPM": "UNDERWAY REPLENISHMENT (OILER/TANKER, STORES, AMMUNITION, TROOP TRANSPORT)", 
            "UXO": "UNEXPLODED ORDINANCE AREA (UXO)", 
            "VCSESD": "VERY COARSE SAND", 
            "VDR1-2": "VDR LEVEL 1-2", 
            "VDR2-3": "VDR LEVEL 2-3", 
            "VDR3-4": "VDR LEVEL 3-4", 
            "VDR4-5": "VDR LEVEL 4-5", 
            "VDR5-6": "VDR LEVEL 5-6", 
            "VDR6-7": "VDR LEVEL 6-7", 
            "VDR7-8": "VDR LEVEL 7-8", 
            "VDR8-9": "VDR LEVEL 8-9", 
            "VDR9-0": "VDR LEVEL 9-10", 
            "VEH": "HIJACKING (VEHICLE)", 
            "VFNESD": "VERY FINE SAND", 
            "VFNSLT": "VERY FINE SILT", 
            "VIOATY": "VIOLENT ACTIVITIES (DEATH CAUSING)", 
            "VLAD": "VERTICAL LINE ARRAY DIFAR (VLAD)", 
            "VNY": "VETERINARY", 
            "VOLASH": "VOLCANIC ASH", 
            "VOLERN": "VOLCANIC ERUPTION", 
            "VRLRPS": "VANDALISM/RAPE/LOOT/RANSACK/PLUNDER/SACK", 
            "VSTOL": "VERTICAL/SHORT TAKEOFF AND LANDING (V/STOL)", 
            "VUL": "VULCAN", 
            "WAMNE": "WIDE AREA MINES", 
            "WAP": "WAYPOINT", 
            "WAR": "WARFIGHTING SYMBOLS", 
            "WARMVH": "WHEELED ARMORED VEHICLE", 
            "WAVS": "WHEELED ARMORED VEHICLE SURVEILLANCE", 
            "WDR": "WITHDRAW", 
            "WDRUP": "WITHDRAW UNDER PRESSURE", 
            "WFZ": "WEAPONS FREE ZONE", 
            "WHD": "WHEELED", 
            "WHMECH": "WHEELED MECHANIZED", 
            "WLG": "RECRUITMENT (WILLING)", 
            "WLST": "WHITE LIST LOCATION", 
            "WND": "WINDS", 
            "WOSMIC": "WITHOUT SNOW OR MEASURABLE ICE COVER", 
            "WP": "PSYOP (WRITTEN PROPAGANDA)", 
            "WPN": "WEAPON", 
            "WPNGR": "WEAPONS GRADE", 
            "WPNRF": "WEAPONS/RADAR RANGE FANS", 
            "WREOBS": "WIRE OBSTACLE", 
            "WRK": "WRECK", 
            "WRKD": "WRECK, DANGEROUS", 
            "WRKND": "WRECK, NON DANGEROUS", 
            "WRMFRN": "WARM FRONT", 
            "WSMIC": "WITH SNOW OR MEASURABLE ICE COVER", 
            "WTH": "WEATHER SYMBOLS", 
            "WWRT": "WATER WITH RADAR TARGETS", 
            "Z": "ZONE", 
            "ZOR": "ZONE OF RESPONSIBILITY (ZOR)"
        },

        "unk": {

            "WAR.UNK": {
                "symbolID": "SUZP------*****", 
                "tag": "UNK"   
            }
        },

        "space": {

            "WAR.SPC": {
                "symbolID": "SUPP------*****", 
                "tag": "WAR"   
            },
            "WAR.SPC.SAT": {
                "symbolID": "SUPPS-----*****",
                "tag": "WAR"  
            },
            "WAR.SPC.CSV": {
                "symbolID": "SUPPV-----*****",
                "tag": "WAR"    
            },
            "WAR.SPC.SST": {
                "symbolID": "SUPPT-----*****",
                "tag": "WAR"    
            }
        },

        "air": {
            "WAR.AIRTRK": {
                "symbolID": "SUAP------*****",
                "tag": "WAR"    
            },
            "WAR.AIRTRK.MIL": {
                "symbolID": "SUAPM-----*****", 
                "tag": "WAR"   
            },
            "WAR.AIRTRK.MIL.FIXD": {
                "symbolID": "SUAPMF----*****",
                "tag": "AIRTRK"    
            },
            "WAR.AIRTRK.MIL.FIXD.BMB": {
                "symbolID": "SUAPMFB---*****", 
                "tag": "MIL"    
            },        
            "WAR.AIRTRK.MIL.FIXD.FTR": {
                "symbolID": "SUAPMFF---*****", 
                "tag": "MIL"    
            },
            "WAR.AIRTRK.MIL.FIXD.FTR.INCR": {
                "symbolID": "SUAPMFFI--*****",
                "tag": "FIXD"    
            },
            "WAR.AIRTRK.MIL.FIXD.TNE": {
                "symbolID": "SUAPMFT---*****", 
                "tag": "MIL"    
            },
            "WAR.AIRTRK.MIL.FIXD.ATK": {
                "symbolID": "SUAPMFA---*****", 
                "tag": "MIL"    
            },
            "WAR.AIRTRK.MIL.FIXD.VSTOL": {
                "symbolID": "SUAPMFL---*****",   
                "tag": "MIL"  
            },
            "WAR.AIRTRK.MIL.FIXD.TNK": {
                "symbolID": "SUAPMFK---*****", 
                "tag": "MIL"    
            },        
            "WAR.AIRTRK.MIL.FIXD.CGOALT": {
                "symbolID": "SUAPMFC---*****", 
                "tag": "MIL"    
            },
            "WAR.AIRTRK.MIL.FIXD.CGOALT.LIT": {
                "symbolID": "SUAPMFCL--*****", 
                "tag": "FIXD"    
            },
            "WAR.AIRTRK.MIL.FIXD.CGOALT.MDM": {
                "symbolID": "SUAPMFCM--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.CGOALT.HVY": {
                "symbolID": "SUAPMFCH--*****", 
                "tag": "FIXD"    
            },
            "WAR.AIRTRK.MIL.FIXD.ECM": {
                "symbolID": "SUAPMFJ---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.FIXD.MEDV": {
                "symbolID": "SUAPMFO---*****", 
                "tag": "MIL"    
            },        
            "WAR.AIRTRK.MIL.FIXD.RECON": {
                "symbolID": "SUAPMFR---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.FIXD.RECON.ABNEW": {
                "symbolID": "SUAPMFRW--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.RECON.ESM": {
                "symbolID": "SUAPMFRZ--*****", 
                "tag": "FIXD"    
            },
            "WAR.AIRTRK.MIL.FIXD.RECON.PHG": {
                "symbolID": "SUAPMFRX--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.PAT": {
                "symbolID": "SUAPMFP---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.FIXD.PAT.ASUW": {
                "symbolID": "SUAPMFPN--*****", 
                "tag": "FIXD"    
            },        
            "WAR.AIRTRK.MIL.FIXD.PAT.MNECM": {
                "symbolID": "SUAPMFPM--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.UTY": {
                "symbolID": "SUAPMFU---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.FIXD.UTY.LIT": {
                "symbolID": "SUAPMFUL--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.UTY.MDM": {
                "symbolID": "SUAPMFUM--*****", 
                "tag": "FIXD"    
            },        
            "WAR.AIRTRK.MIL.FIXD.UTY.HVY": {
                "symbolID": "SUAPMFUH--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.COMM": {
                "symbolID": "SUAPMFY---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.FIXD.CSAR": {
                "symbolID": "SUAPMFH---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.FIXD.ABNCP": {
                "symbolID": "SUAPMFD---*****", 
                "tag": "MIL"    
            },        
            "WAR.AIRTRK.MIL.FIXD.DRN": {
                "symbolID": "SUAPMFQ---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.ATK": {
                "symbolID": "SUAPMFQA--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.BMB": {
                "symbolID": "SUAPMFQB--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.CGO": {
                "symbolID": "SUAPMFQC--*****", 
                "tag": "FIXD"    
            },        
            "WAR.AIRTRK.MIL.FIXD.DRN.ABNCP": {
                "symbolID": "SUAPMFQD--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.FTR": {
                "symbolID": "SUAPMFQF--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.CSAR": {
                "symbolID": "SUAPMFQH--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.ECM": {
                "symbolID": "SUAPMFQJ--*****", 
                "tag": "FIXD"    
            },        
            "WAR.AIRTRK.MIL.FIXD.DRN.TNK": {
                "symbolID": "SUAPMFQK--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.VSTOL": {
                "symbolID": "SUAPMFQL--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.SOF": {
                "symbolID": "SUAPMFQM--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.MNECM": {
                "symbolID": "SUAPMFQI--*****", 
                "tag": "FIXD"    
            },        
            "WAR.AIRTRK.MIL.FIXD.DRN.ASUW": {
                "symbolID": "SUAPMFQN--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.PAT": {
                "symbolID": "SUAPMFQP--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.RECON": {
                "symbolID": "SUAPMFQR--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.RECON.ABNEW": {
                "symbolID": "SUAPMFQRW-*****", 
                "tag": "DRN"    
            },        
            "WAR.AIRTRK.MIL.FIXD.DRN.RECON.ESM": {
                "symbolID": "SUAPMFQRZ-*****",  
                "tag": "DRN"   
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.RECON.PHG": {
                "symbolID": "SUAPMFQRX-*****",
                "tag": "DRN"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.ASBW": {
                "symbolID": "SUAPMFQS--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.TNE": {
                "symbolID": "SUAPMFQT--*****", 
                "tag": "FIXD"    
            },        
            "WAR.AIRTRK.MIL.FIXD.DRN.UTY": {
                "symbolID": "SUAPMFQU--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.COMM": {
                "symbolID": "SUAPMFQY--*****",
                "tag": "FIXD"     
            },
            "WAR.AIRTRK.MIL.FIXD.DRN.MEDV": {
                "symbolID": "SUAPMFQO--*****",  
                "tag": "FIXD"   
            },
            "WAR.AIRTRK.MIL.FIXD.ASBWCB": {
                "symbolID": "SUAPMFS---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.FIXD.SOF": {
                "symbolID": "SUAPMFM---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT": {
                "symbolID": "SUAPMH----*****",
                "tag": "AIRTRK"     
            },
            "WAR.AIRTRK.MIL.ROT.ATK": {
                "symbolID": "SUAPMHA---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.ASBW": {
                "symbolID": "SUAPMHS---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.ROT.UTY": {
                "symbolID": "SUAPMHU---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.UTY.LIT": {
                "symbolID": "SUAPMHUL--*****",
                "tag": "ROT"     
            },
            "WAR.AIRTRK.MIL.ROT.UTY.MDM": {
                "symbolID": "SUAPMHUM--*****",  
                "tag": "ROT"   
            },
            "WAR.AIRTRK.MIL.ROT.UTY.HVY": {
                "symbolID": "SUAPMHUH--*****",
                "tag": "ROT"     
            },
            "WAR.AIRTRK.MIL.ROT.MNECM": {
                "symbolID": "SUAPMHI---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.CSAR": {
                "symbolID": "SUAPMHH---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.ROT.RECON": {
                "symbolID": "SUAPMHR---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.DRN": {
                "symbolID": "SUAPMHQ---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.ROT.CGOALT": {
                "symbolID": "SUAPMHC---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.CGOALT.LIT": {
                "symbolID": "SUAPMHCL--*****",
                "tag": "ROT"     
            },
            "WAR.AIRTRK.MIL.ROT.CGOALT.MDM": {
                "symbolID": "SUAPMHCM--*****",  
                "tag": "ROT"   
            },
            "WAR.AIRTRK.MIL.ROT.CGOALT.HVY": {
                "symbolID": "SUAPMHCH--*****",
                "tag": "ROT"     
            },
            "WAR.AIRTRK.MIL.ROT.TNE": {
                "symbolID": "SUAPMHT---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.MEDV": {
                "symbolID": "SUAPMHO---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.ROT.SOF": {
                "symbolID": "SUAPMHM---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.ABNCP": {
                "symbolID": "SUAPMHD---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.ROT.TNK": {
                "symbolID": "SUAPMHK---*****",  
                "tag": "MIL"   
            },
            "WAR.AIRTRK.MIL.ROT.ECM": {
                "symbolID": "SUAPMHJ---*****",
                "tag": "MIL"     
            },
            "WAR.AIRTRK.MIL.LTA": {
                "symbolID": "SUAPML----*****",  
                "tag": "AIRTRK"   
            },
            "WAR.AIRTRK.MIL.VIP": {
                "symbolID": "SUAPMV----*****",  
                "tag": "AIRTRK"   
            },
            "WAR.AIRTRK.MIL.ESCORT": {
                "symbolID": "SUAPME----*****",  
                "tag": "AIRTRK"   
            },
            "WAR.AIRTRK.WPN": {
                "symbolID": "SUAPW-----*****",
                "tag": "WAR"     
            },
            "WAR.AIRTRK.WPN.MSLIF": {
                "symbolID": "SUAPWM----*****",  
                "tag": "AIRTRK"   
            },
            "WAR.AIRTRK.WPN.MSLIF.SLM": {
                "symbolID": "SUAPWMS---*****",
                "tag": "WPN"     
            },
            "WAR.AIRTRK.WPN.MSLIF.SLM.SSM": {
                "symbolID": "SUAPWMSS--*****",  
                "tag": "MSLIF"   
            },
            "WAR.AIRTRK.WPN.MSLIF.SLM.SAM": {
                "symbolID": "SUAPWMSA--*****",
                "tag": "MSLIF"     
            },
            "WAR.AIRTRK.WPN.MSLIF.ALM": {
                "symbolID": "SUAPWMA---*****",  
                "tag": "WPN"   
            },
            "WAR.AIRTRK.WPN.MSLIF.ALM.ASM": {
                "symbolID": "SUAPWMAS--*****",
                "tag": "MSLIF"     
            },
            "WAR.AIRTRK.WPN.MSLIF.ALM.AAM": {
                "symbolID": "SUAPWMAA--*****",  
                "tag": "MSLIF"   
            },
            "WAR.AIRTRK.WPN.MSLIF.SBSM": {
                "symbolID": "SUAPWMU---*****",
                "tag": "WPN"     
            },
            "WAR.AIRTRK.WPN.MSLIF.CM": {
                "symbolID": "SUAPWMCM--*****",  
                "tag": "WPN"   
            },
            "WAR.AIRTRK.WPN.DCY": {
                "symbolID": "SUAPWD----*****",
                "tag": "AIRTRK"     
            },
            "WAR.AIRTRK.CVL": {
                "symbolID": "SUAPC-----*****",  
                "tag": "WAR"   
            },
            "WAR.AIRTRK.CVL.FIXD": {
                "symbolID": "SUAPCF----*****",
                "tag": "AIRTRK"     
            },
            "WAR.AIRTRK.CVL.ROT": {
                "symbolID": "SUAPCH----*****",  
                "tag": "AIRTRK"   
            },
            "WAR.AIRTRK.CVL.LTA": {
                "symbolID": "SUAPCL----*****",
                "tag": "AIRTRK"     
            }
        },

        "ground": {
            "WAR.GRDTRK": {
                "symbolID": "SUGP------*****",  
                "tag": "WAR"   
            },
            "WAR.GRDTRK.UNT": {
                "symbolID": "SUGPU-----*****",
                "tag": "WAR"     
            },
            "WAR.GRDTRK.UNT.CBT": {
                "symbolID": "SUGPUC----*****",  
                "tag": "GRDTRK"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF": {
                "symbolID": "SUGPUCD---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.SHTR": {
                "symbolID": "SUGPUCDS--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.SHTR.CPL": {
                "symbolID": "SUGPUCDSC-*****",
                "tag": "ADF"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.SHTR.STG": {
                "symbolID": "SUGPUCDSS-*****",  
                "tag": "ADF"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.SHTR.VUL": {
                "symbolID": "SUGPUCDSV-*****",
                "tag": "ADF"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL": {
                "symbolID": "SUGPUCDM--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL.LIT": {
                "symbolID": "SUGPUCDML-*****",
                "tag": "ADF"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL.LIT.MOT": {
                "symbolID": "SUGPUCDMLA*****",  
                "tag": "MSL"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL.MDM": {
                "symbolID": "SUGPUCDMM-*****",
                "tag": "ADF"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL.HVY": {
                "symbolID": "SUGPUCDMH-*****",  
                "tag": "ADF"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL.HMAD": {
                "symbolID": "SUGPUCDH--*****",
                "tag": "ADF"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL.HMAD.HWK": {
                "symbolID": "SUGPUCDHH-*****",  
                "tag": "MSL"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.MSL.HMAD.PATT": {
                "symbolID": "SUGPUCDHP-*****",
                "tag": "MSL"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.GUNUNT": {
                "symbolID": "SUGPUCDG--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.CMPS": {
                "symbolID": "SUGPUCDC--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ADF.TGTGUT": {
                "symbolID": "SUGPUCDT--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.ADF.TMDU": {
                "symbolID": "SUGPUCDO--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM": {
                "symbolID": "SUGPUCA---*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK": {
                "symbolID": "SUGPUCAT--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK.ABN": {
                "symbolID": "SUGPUCATA-*****",  
                "tag": "ARM"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK.AMP": {
                "symbolID": "SUGPUCATW-*****",
                "tag": "ARM"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK.AMP.RCY": {
                "symbolID": "SUGPUCATWR*****",  
                "tag": "TRK"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK.LIT": {
                "symbolID": "SUGPUCATL-*****",
                "tag": "ARM"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK.MDM": {
                "symbolID": "SUGPUCATM-*****",  
                "tag": "ARM"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK.HVY": {
                "symbolID": "SUGPUCATH-*****",
                "tag": "ARM"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.TRK.RCY": {
                "symbolID": "SUGPUCATR-*****",  
                "tag": "ARM"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD": {
                "symbolID": "SUGPUCAW--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.AAST": {
                "symbolID": "SUGPUCAWS-*****",  
                "tag": "ARM"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.ABN": {
                "symbolID": "SUGPUCAWA-*****",
                "tag": "ARM"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.AMP": {
                "symbolID": "SUGPUCAWW-*****",  
                "tag": "ARM"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.AMP.RCY": {
                "symbolID": "SUGPUCAWWR*****",
                "tag": "WHD"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.LIT": {
                "symbolID": "SUGPUCAWL-*****",  
                "tag": "ARM"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.MDM": {
                "symbolID": "SUGPUCAWM-*****",
                "tag": "ARM"     
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.HVY": {
                "symbolID": "SUGPUCAWH-*****",  
                "tag": "ARM"   
            },
            "WAR.GRDTRK.UNT.CBT.ARM.WHD.RCY": {
                "symbolID": "SUGPUCAWR-*****",
                "tag": "ARM"     
            },
            "WAR.GRDTRK.UNT.CBT.AARM": {
                "symbolID": "SUGPUCAA--*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CBT.AARM.DMD": {
                "symbolID": "SUGPUCAAD-*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AARM.LIT": {
                "symbolID": "SUGPUCAAL-*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.AARM.ABN": {
                "symbolID": "SUGPUCAAM-*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AARM.AAST": {
                "symbolID": "SUGPUCAAS-*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.AARM.MNT": {
                "symbolID": "SUGPUCAAU-*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AARM.ARC": {
                "symbolID": "SUGPUCAAC-*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.AARM.ARMD": {
                "symbolID": "SUGPUCAAA-*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AARM.ARMD.TKD": {
                "symbolID": "SUGPUCAAAT*****",  
                "tag": "AARM"   
            },
            "WAR.GRDTRK.UNT.CBT.AARM.ARMD.WHD": {
                "symbolID": "SUGPUCAAAW*****",
                "tag": "AARM"     
            },
            "WAR.GRDTRK.UNT.CBT.AARM.ARMD.AAST": {
                "symbolID": "SUGPUCAAAS*****",  
                "tag": "AARM"   
            },
            "WAR.GRDTRK.UNT.CBT.AARM.MOT": {
                "symbolID": "SUGPUCAAO-*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AARM.MOT.AAST": {
                "symbolID": "SUGPUCAAOS*****",  
                "tag": "AARM"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN": {
                "symbolID": "SUGPUCV---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.FIXD": {
                "symbolID": "SUGPUCVF--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.FIXD.UTY": {
                "symbolID": "SUGPUCVFU-*****",  
                "tag": "AVN"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.FIXD.ATK": {
                "symbolID": "SUGPUCVFA-*****",
                "tag": "AVN"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.FIXD.RECON": {
                "symbolID": "SUGPUCVFR-*****",  
                "tag": "AVN"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT": {
                "symbolID": "SUGPUCVR--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.ATK": {
                "symbolID": "SUGPUCVRA-*****",  
                "tag": "AVN"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.SCUT": {
                "symbolID": "SUGPUCVRS-*****",
                "tag": "AVN"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.ASBW": {
                "symbolID": "SUGPUCVRW-*****",  
                "tag": "AVN"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.UTY": {
                "symbolID": "SUGPUCVRU-*****",
                "tag": "AVN"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.UTY.LIT": {
                "symbolID": "SUGPUCVRUL*****",  
                "tag": "ROT"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.UTY.MDM": {
                "symbolID": "SUGPUCVRUM*****",
                "tag": "ROT"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.UTY.HVY": {
                "symbolID": "SUGPUCVRUH*****",  
                "tag": "ROT"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.C2": {
                "symbolID": "SUGPUCVRUC*****",
                "tag": "AVN"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.MEDV": {
                "symbolID": "SUGPUCVRUE*****",  
                "tag": "AVN"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.ROT.MNECM": {
                "symbolID": "SUGPUCVRM-*****",
                "tag": "AVN"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.SAR": {
                "symbolID": "SUGPUCVS--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.CMPS": {
                "symbolID": "SUGPUCVC--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.VSTOL": {
                "symbolID": "SUGPUCVV--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.UAV": {
                "symbolID": "SUGPUCVU--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.AVN.UAV.FIXD": {
                "symbolID": "SUGPUCVUF-*****",  
                "tag": "AVN"   
            },
            "WAR.GRDTRK.UNT.CBT.AVN.UAV.ROT": {
                "symbolID": "SUGPUCVUR-*****",
                "tag": "AVN"     
            },
            "WAR.GRDTRK.UNT.CBT.INF": {
                "symbolID": "SUGPUCI---*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CBT.INF.LIT": {
                "symbolID": "SUGPUCIL--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.INF.MOT": {
                "symbolID": "SUGPUCIM--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.INF.MNT": {
                "symbolID": "SUGPUCIO--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.INF.ABN": {
                "symbolID": "SUGPUCIA--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.INF.AAST": {
                "symbolID": "SUGPUCIS--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.INF.MECH": {
                "symbolID": "SUGPUCIZ--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.INF.NAV": {
                "symbolID": "SUGPUCIN--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.INF.INFFV": {
                "symbolID": "SUGPUCII--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.INF.ARC": {
                "symbolID": "SUGPUCIC--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG": {
                "symbolID": "SUGPUCE---*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT": {
                "symbolID": "SUGPUCEC--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.AAST": {
                "symbolID": "SUGPUCECS-*****",  
                "tag": "ENG"   
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.ABN": {
                "symbolID": "SUGPUCECA-*****",
                "tag": "ENG"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.ARC": {
                "symbolID": "SUGPUCECC-*****",
                "tag": "ENG"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.LIT": {
                "symbolID": "SUGPUCECL-*****",  
                "tag": "ENG"   
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.MDM": {
                "symbolID": "SUGPUCECM-*****",
                "tag": "ENG"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.HVY": {
                "symbolID": "SUGPUCECH-*****",  
                "tag": "ENG"   
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.MECH": {
                "symbolID": "SUGPUCECT-*****",
                "tag": "ENG"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.MOT": {
                "symbolID": "SUGPUCECW-*****",  
                "tag": "ENG"   
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.MNT": {
                "symbolID": "SUGPUCECO-*****",
                "tag": "ENG"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CBT.RECON": {
                "symbolID": "SUGPUCECR-*****",  
                "tag": "ENG"   
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CSN": {
                "symbolID": "SUGPUCEN--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ENG.CSN.NAV": {
                "symbolID": "SUGPUCENN-*****",  
                "tag": "ENG"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART": {
                "symbolID": "SUGPUCF---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW": {
                "symbolID": "SUGPUCFH--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.SPD": {
                "symbolID": "SUGPUCFHE-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.AAST": {
                "symbolID": "SUGPUCFHS-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.ABN": {
                "symbolID": "SUGPUCFHA-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.ARC": {
                "symbolID": "SUGPUCFHC-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.MNT": {
                "symbolID": "SUGPUCFHO-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.LIT": {
                "symbolID": "SUGPUCFHL-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.MDM": {
                "symbolID": "SUGPUCFHM-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.HVY": {
                "symbolID": "SUGPUCFHH-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.HOW.AMP": {
                "symbolID": "SUGPUCFHX-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC": {
                "symbolID": "SUGPUCFR--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.SRL": {
                "symbolID": "SUGPUCFRS-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.SRL.SRSPD": {
                "symbolID": "SUGPUCFRSS*****",  
                "tag": "ROC"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.SRL.SRTRK": {
                "symbolID": "SUGPUCFRSR*****",
                "tag": "ROC"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.SRL.SRTOW": {
                "symbolID": "SUGPUCFRST*****",  
                "tag": "ROC"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.MRL": {
                "symbolID": "SUGPUCFRM-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.MRL.MRSPD": {
                "symbolID": "SUGPUCFRMS*****",  
                "tag": "ROC"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.MRL.MRTRK": {
                "symbolID": "SUGPUCFRMR*****",
                "tag": "ROC"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ROC.MRL.MRTOW": {
                "symbolID": "SUGPUCFRMT*****",  
                "tag": "ROC"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ": {
                "symbolID": "SUGPUCFT--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ.RAD": {
                "symbolID": "SUGPUCFTR-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ.SND": {
                "symbolID": "SUGPUCFTS-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ.FLH": {
                "symbolID": "SUGPUCFTF-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ.CLT": {
                "symbolID": "SUGPUCFTC-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ.CLT.DMD": {
                "symbolID": "SUGPUCFTCD*****",
                "tag": "TGTAQ"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ.CLT.TKD": {
                "symbolID": "SUGPUCFTCM*****",  
                "tag": "TGTAQ"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.TGTAQ.ANG": {
                "symbolID": "SUGPUCFTA-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT": {
                "symbolID": "SUGPUCFM--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.SPDTRK": {
                "symbolID": "SUGPUCFMS-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.SPDWHD": {
                "symbolID": "SUGPUCFMW-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.TOW": {
                "symbolID": "SUGPUCFMT-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.TOW.ABN": {
                "symbolID": "SUGPUCFMTA*****",  
                "tag": "MORT"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.TOW.AAST": {
                "symbolID": "SUGPUCFMTS*****",
                "tag": "MORT"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.TOW.ARC": {
                "symbolID": "",  
                "tag": "MORT"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.TOW.MNT": {
                "symbolID": "SUGPUCFMTO*****",
                "tag": "MORT"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.MORT.AMP": {
                "symbolID": "SUGPUCFML-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ARTSVY": {
                "symbolID": "SUGPUCFS--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ARTSVY.AAST": {
                "symbolID": "SUGPUCFSS-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ARTSVY.ABN": {
                "symbolID": "SUGPUCFSA-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ARTSVY.LIT": {
                "symbolID": "SUGPUCFSL-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.ARTSVY.MNT": {
                "symbolID": "SUGPUCFSO-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.METO": {
                "symbolID": "SUGPUCFO--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.METO.AAST": {
                "symbolID": "SUGPUCFOS-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.METO.ABN": {
                "symbolID": "SUGPUCFOA-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.METO.LIT": {
                "symbolID": "SUGPUCFOL-*****",
                "tag": "FLDART"     
            },
            "WAR.GRDTRK.UNT.CBT.FLDART.METO.MNT": {
                "symbolID": "SUGPUCFOO-*****",  
                "tag": "FLDART"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON": {
                "symbolID": "SUGPUCR---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.HRE": {
                "symbolID": "SUGPUCRH--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON.CVY": {
                "symbolID": "SUGPUCRV--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.CVY.ARMD": {
                "symbolID": "SUGPUCRVA-*****",  
                "tag": "RECON"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON.CVY.MOT": {
                "symbolID": "SUGPUCRVM-*****",
                "tag": "RECON"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.CVY.GRD": {
                "symbolID": "SUGPUCRVG-*****",  
                "tag": "RECON"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON.CVY.AIR": {
                "symbolID": "SUGPUCRVO-*****",
                "tag": "RECON"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.ARC": {
                "symbolID": "SUGPUCRC--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON.AAST": {
                "symbolID": "SUGPUCRS--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.ABN": {
                "symbolID": "SUGPUCRA--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON.MNT": {
                "symbolID": "SUGPUCRO--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.LIT": {
                "symbolID": "SUGPUCRL--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON.MAR": {
                "symbolID": "SUGPUCRR--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.MAR.DIV": {
                "symbolID": "SUGPUCRRD-*****",
                "tag": "RECON"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.MAR.FOR": {
                "symbolID": "SUGPUCRRF-*****",  
                "tag": "RECON"   
            },
            "WAR.GRDTRK.UNT.CBT.RECON.MAR.LAR": {
                "symbolID": "SUGPUCRRL-*****",
                "tag": "RECON"     
            },
            "WAR.GRDTRK.UNT.CBT.RECON.LRS": {
                "symbolID": "SUGPUCRX--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.MSL": {
                "symbolID": "SUGPUCM---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CBT.MSL.TAC": {
                "symbolID": "SUGPUCMT--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.MSL.STGC": {
                "symbolID": "SUGPUCMS--*****",  
                "tag": "CBT"   
            },
            // "WAR.GRDTRK.UNT.CBT.MSL": {
            //     "symbolID": "SUGPUCM---*****",
            //     "tag": "UNT"     
            // },
            // "WAR.GRDTRK.UNT.CBT.MSL.TAC": {
            //     "symbolID": "SUGPUCMT--*****",  
            //     "tag": "CBT"   
            // },
            // "WAR.GRDTRK.UNT.CBT.MSL.STGC": {
            //     "symbolID": "SUGPUCMS--*****",
            //     "tag": "CBT"     
            // },
            "WAR.GRDTRK.UNT.CBT.ISF": {
                "symbolID": "SUGPUCS---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CBT.ISF.RIV": {
                "symbolID": "SUGPUCSW--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.ISF.GRD": {
                "symbolID": "SUGPUCSG--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ISF.GRD.DMD": {
                "symbolID": "SUGPUCSGD-*****",  
                "tag": "ISF"   
            },
            "WAR.GRDTRK.UNT.CBT.ISF.GRD.MOT": {
                "symbolID": "SUGPUCSGM-*****",
                "tag": "ISF"     
            },
            "WAR.GRDTRK.UNT.CBT.ISF.GRD.MECH": {
                "symbolID": "SUGPUCSGA-*****",
                "tag": "ISF"     
            },
            "WAR.GRDTRK.UNT.CBT.ISF.WHMECH": {
                "symbolID": "SUGPUCSM--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CBT.ISF.RALRD": {
                "symbolID": "SUGPUCSR--*****",
                "tag": "CBT"     
            },
            "WAR.GRDTRK.UNT.CBT.ISF.AVN": {
                "symbolID": "SUGPUCSA--*****",  
                "tag": "CBT"   
            },
            "WAR.GRDTRK.UNT.CS": {
                "symbolID": "SUGPUU----*****",
                "tag": "GRDTRK"     
            },
            "WAR.GRDTRK.UNT.CS.NBC": {
                "symbolID": "SUGPUUA---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML": {
                "symbolID": "SUGPUUAC--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.SMKDEC": {
                "symbolID": "SUGPUUACC-*****",
                "tag": "NBC"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.SMKDEC.MECH": {
                "symbolID": "SUGPUUACCK*****",  
                "tag": "CML"   
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.SMKDEC.MOT": {
                "symbolID": "SUGPUUACCM*****",
                "tag": "CML"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.SMK": {
                "symbolID": "SUGPUUACS-*****",
                "tag": "NBC"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.SMK.MOT": {
                "symbolID": "SUGPUUACSM*****",  
                "tag": "CML"   
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.SMK.ARM": {
                "symbolID": "SUGPUUACSA*****",
                "tag": "CML"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.RECON": {
                "symbolID": "SUGPUUACR-*****",  
                "tag": "NBC"   
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.RECON.WARMVH": {
                "symbolID": "SUGPUUACRW*****",
                "tag": "CML"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.CML.RECON.WAVS": {
                "symbolID": "SUGPUUACRS*****",
                "tag": "CML"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.NUC": {
                "symbolID": "SUGPUUAN--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.NBC.BIO": {
                "symbolID": "SUGPUUAB--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.NBC.BIO.RECEQP": {
                "symbolID": "SUGPUUABR-*****",  
                "tag": "NBC"   
            },
            "WAR.GRDTRK.UNT.CS.NBC.DECON": {
                "symbolID": "SUGPUUAD--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT": {
                "symbolID": "SUGPUUM---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.AEREXP": {
                "symbolID": "SUGPUUMA--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT": {
                "symbolID": "SUGPUUMS--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT.ECW": {
                "symbolID": "SUGPUUMSE-*****",  
                "tag": "MILINT"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT.ECW.ARMWVH": {
                "symbolID": "SUGPUUMSEA*****",
                "tag": "SIGINT"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT.ECW.DFN": {
                "symbolID": "SUGPUUMSED*****",
                "tag": "SIGINT"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT.ECW.INC": {
                "symbolID": "SUGPUUMSEI*****",  
                "tag": "SIGINT"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT.ECW.JMG": {
                "symbolID": "SUGPUUMSEJ*****",
                "tag": "SIGINT"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT.ECW.THT": {
                "symbolID": "SUGPUUMSET*****",  
                "tag": "SIGINT"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SIGINT.ECW.CRP": {
                "symbolID": "SUGPUUMSEC*****",
                "tag": "SIGINT"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.CINT": {
                "symbolID": "SUGPUUMC--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SVL": {
                "symbolID": "SUGPUUMR--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SVL.GRDSR": {
                "symbolID": "SUGPUUMRG-*****",
                "tag": "MILINT"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SVL.SNS": {
                "symbolID": "SUGPUUMRS-*****",  
                "tag": "MILINT"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SVL.SNS.SCM": {
                "symbolID": "SUGPUUMRSS*****",
                "tag": "SVL"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SVL.GRDSM": {
                "symbolID": "SUGPUUMRX-*****",
                "tag": "MILINT"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.SVL.METO": {
                "symbolID": "SUGPUUMMO-*****",  
                "tag": "MILINT"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.OPN": {
                "symbolID": "SUGPUUMO--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.TACEXP": {
                "symbolID": "SUGPUUMT--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.MILINT.INTGN": {
                "symbolID": "SUGPUUMQ--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.MILINT.JINTCT": {
                "symbolID": "SUGPUUMJ--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.LAWENU": {
                "symbolID": "SUGPUUL---*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CS.LAWENU.SHRPAT": {
                "symbolID": "SUGPUULS--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.LAWENU.MILP": {
                "symbolID": "SUGPUULM--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.LAWENU.CLE": {
                "symbolID": "SUGPUULC--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.LAWENU.SECPOL": {
                "symbolID": "SUGPUULF--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.LAWENU.CID": {
                "symbolID": "SUGPUULD--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT": {
                "symbolID": "SUGPUUS---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.ARA": {
                "symbolID": "SUGPUUSA--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.COMCP": {
                "symbolID": "SUGPUUSC--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.COMCP.LCCP": {
                "symbolID": "SUGPUUSCL-*****",
                "tag": "SIGUNT"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.CMDOPN": {
                "symbolID": "SUGPUUSO--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.FWDCOM": {
                "symbolID": "SUGPUUSF--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.MSE": {
                "symbolID": "SUGPUUSM--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.MSE.SEN": {
                "symbolID": "SUGPUUSMS-*****",
                "tag": "SIGUNT"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.MSE.LEN": {
                "symbolID": "SUGPUUSML-*****",
                "tag": "SIGUNT"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.MSE.NODCTR": {
                "symbolID": "SUGPUUSMN-*****",  
                "tag": "SIGUNT"   
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.RDOUNT": {
                "symbolID": "SUGPUUSR--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.RDOUNT.TACSAT": {
                "symbolID": "SUGPUUSRS-*****",  
                "tag": "SIGUNT"   
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.RDOUNT.TTYCTR": {
                "symbolID": "SUGPUUSRT-*****",
                "tag": "SIGUNT"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.RDOUNT.RLY": {
                "symbolID": "SUGPUUSRW-*****",
                "tag": "SIGUNT"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.SIGSUP": {
                "symbolID": "SUGPUUSS--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.PHOSWT": {
                "symbolID": "SUGPUUSW--*****",
                "tag": "CS"     
            },
            "WAR.GRDTRK.UNT.CS.SIGUNT.ECRG": {
                "symbolID": "SUGPUUSX--*****",  
                "tag": "CS"   
            },
            "WAR.GRDTRK.UNT.CS.IWU": {
                "symbolID": "SUGPUUI---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CS.LNDSUP": {
                "symbolID": "SUGPUUP---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CS.EOD": {
                "symbolID": "SUGPUUE---*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CSS": {
                "symbolID": "SUGPUS----*****",
                "tag": "GRDTRK"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN": {
                "symbolID": "SUGPUSA---*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.THT": {
                "symbolID": "SUGPUSAT--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.CRP": {
                "symbolID": "SUGPUSAC--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.JAG": {
                "symbolID": "SUGPUSAJ--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.JAG.THT": {
                "symbolID": "SUGPUSAJT-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.JAG.CRP": {
                "symbolID": "SUGPUSAJC-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PST": {
                "symbolID": "SUGPUSAO--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PST.THT": {
                "symbolID": "SUGPUSAOT-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PST.CRP": {
                "symbolID": "SUGPUSAOC-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.FIN": {
                "symbolID": "SUGPUSAF--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.FIN.THT": {
                "symbolID": "SUGPUSAFT-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.FIN.CRP": {
                "symbolID": "SUGPUSAFC-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PERSVC": {
                "symbolID": "SUGPUSAS--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PERSVC.THT": {
                "symbolID": "SUGPUSAST-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PERSVC.CRP": {
                "symbolID": "SUGPUSASC-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.MTRY": {
                "symbolID": "SUGPUSAM--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.MTRY.THT": {
                "symbolID": "SUGPUSAMT-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.MTRY.CRP": {
                "symbolID": "SUGPUSAMC-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.RELG": {
                "symbolID": "SUGPUSAR--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.RELG.THT": {
                "symbolID": "SUGPUSART-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.RELG.CRP": {
                "symbolID": "SUGPUSARC-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF": {
                "symbolID": "SUGPUSAP--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.THT": {
                "symbolID": "SUGPUSAPT-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.CRP": {
                "symbolID": "SUGPUSAPC-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.BRCT": {
                "symbolID": "SUGPUSAPB-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.BRCT.THT": {
                "symbolID": "SUGPUSAPBT*****",  
                "tag": "PUBAFF"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.BRCT.CRP": {
                "symbolID": "SUGPUSAPBC*****",
                "tag": "PUBAFF"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.JIB": {
                "symbolID": "SUGPUSAPM-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.JIB.THT": {
                "symbolID": "SUGPUSAPMT*****",  
                "tag": "PUBAFF"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.PUBAFF.JIB.CRP": {
                "symbolID": "SUGPUSAPMC*****",
                "tag": "PUBAFF"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.RHU": {
                "symbolID": "SUGPUSAX--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.RHU.THT": {
                "symbolID": "SUGPUSAXT-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.RHU.CRP": {
                "symbolID": "SUGPUSAXC-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.LBR": {
                "symbolID": "SUGPUSAL--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.LBR.THT": {
                "symbolID": "SUGPUSALT-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.LBR.CRP": {
                "symbolID": "SUGPUSALC-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.MWR": {
                "symbolID": "SUGPUSAW--*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.MWR.THT": {
                "symbolID": "SUGPUSAWT-*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.MWR.CRP": {
                "symbolID": "SUGPUSAWC-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.SUPPLY": {
                "symbolID": "SUGPUSAQ--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.SUPPLY.THT": {
                "symbolID": "SUGPUSAQT-*****",  
                "tag": "ADMIN"   
            },
            "WAR.GRDTRK.UNT.CSS.ADMIN.SUPPLY.CRP": {
                "symbolID": "SUGPUSAQC-*****",
                "tag": "ADMIN"     
            },
            "WAR.GRDTRK.UNT.CSS.MED": {
                "symbolID": "SUGPUSM---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.THT": {
                "symbolID": "SUGPUSMT--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.MED.CRP": {
                "symbolID": "SUGPUSMC--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.MEDTF": {
                "symbolID": "SUGPUSMM--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.MED.MEDTF.THT": {
                "symbolID": "SUGPUSMMT-*****",
                "tag": "MED"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.MEDTF.CRP": {
                "symbolID": "SUGPUSMMC-*****",
                "tag": "MED"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.VNY": {
                "symbolID": "SUGPUSMV--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.MED.VNY.THT": {
                "symbolID": "SUGPUSMVT-*****",
                "tag": "MED"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.VNY.CRP": {
                "symbolID": "SUGPUSMVC-*****",  
                "tag": "MED"   
            },
            "WAR.GRDTRK.UNT.CSS.MED.DEN": {
                "symbolID": "SUGPUSMD--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.DEN.THT": {
                "symbolID": "SUGPUSMDT-*****",
                "tag": "MED"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.DEN.CRP": {
                "symbolID": "SUGPUSMDC-*****",  
                "tag": "MED"   
            },
            "WAR.GRDTRK.UNT.CSS.MED.PSY": {
                "symbolID": "SUGPUSMP--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.MED.PSY.THT": {
                "symbolID": "SUGPUSMPT-*****",  
                "tag": "MED"   
            },
            "WAR.GRDTRK.UNT.CSS.MED.PSY.CRP": {
                "symbolID": "SUGPUSMPC-*****",
                "tag": "MED"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP": {
                "symbolID": "SUGPUSS---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.THT": {
                "symbolID": "SUGPUSST--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CRP": {
                "symbolID": "SUGPUSSC--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS1": {
                "symbolID": "SUGPUSS1--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS1.THT": {
                "symbolID": "SUGPUSS1T-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS1.CRP": {
                "symbolID": "SUGPUSS1C-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS2": {
                "symbolID": "SUGPUSS2--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS2.THT": {
                "symbolID": "SUGPUSS2T-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS2.CRP": {
                "symbolID": "SUGPUSS2C-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS3": {
                "symbolID": "SUGPUSS3--*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS3.THT": {
                "symbolID": "SUGPUSS3T-*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS3.CRP": {
                "symbolID": "SUGPUSS3C-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS3.AVN": {
                "symbolID": "SUGPUSS3A-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS3.AVN.THT": {
                "symbolID": "SUGPUSS3AT*****",  
                "tag": "CLS3"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS3.AVN.CRP": {
                "symbolID": "SUGPUSS3AC*****",
                "tag": "CLS3"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS4": {
                "symbolID": "SUGPUSS4--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS4.THT": {
                "symbolID": "SUGPUSS4T-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS4.CRP": {
                "symbolID": "SUGPUSS4C-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS5": {
                "symbolID": "SUGPUSS5--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS5.THT": {
                "symbolID": "SUGPUSS5T-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS5.CRP": {
                "symbolID": "SUGPUSS5C-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS6": {
                "symbolID": "SUGPUSS6--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS6.THT": {
                "symbolID": "SUGPUSS6T-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS6.CRP": {
                "symbolID": "SUGPUSS6C-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS7": {
                "symbolID": "SUGPUSS7--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS7.THT": {
                "symbolID": "SUGPUSS7T-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS7.CRP": {
                "symbolID": "SUGPUSS7C-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS8": {
                "symbolID": "SUGPUSS8--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS8.THT": {
                "symbolID": "SUGPUSS8T-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS8.CRP": {
                "symbolID": "SUGPUSS8C-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS9": {
                "symbolID": "SUGPUSS9--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS9.THT": {
                "symbolID": "SUGPUSS9T-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS9.CRP": {
                "symbolID": "SUGPUSS9C-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS10": {
                "symbolID": "SUGPUSSX--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS10.THT": {
                "symbolID": "SUGPUSSXT-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.CLS10.CRP": {
                "symbolID": "SUGPUSSXC-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.LDY": {
                "symbolID": "SUGPUSSL--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.LDY.THT": {
                "symbolID": "SUGPUSSLT-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.LDY.CRP": {
                "symbolID": "SUGPUSSLC-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.H2O": {
                "symbolID": "SUGPUSSW--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.H2O.THT": {
                "symbolID": "SUGPUSSWT-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.H2O.CRP": {
                "symbolID": "SUGPUSSWC-*****",  
                "tag": "SLP"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.H2O.PUR": {
                "symbolID": "SUGPUSSWP-*****",
                "tag": "SLP"     
            },
            "WAR.GRDTRK.UNT.CSS.SLP.H2O.PUR.THT": {
                "symbolID": "SUGPUSSWPT*****",  
                "tag": "H2O"   
            },
            "WAR.GRDTRK.UNT.CSS.SLP.H2O.PUR.CRP": {
                "symbolID": "SUGPUSSWPC*****",
                "tag": "H2O"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT": {
                "symbolID": "SUGPUST---*****",
                "tag": "UNT"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.THT": {
                "symbolID": "SUGPUSTT--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.CRP": {
                "symbolID": "SUGPUSTC--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.MCC": {
                "symbolID": "SUGPUSTM--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.MCC.THT": {
                "symbolID": "SUGPUSTMT-*****",
                "tag": "TPT"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.MCC.CRP": {
                "symbolID": "SUGPUSTMC-*****",
                "tag": "TPT"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.RHD": {
                "symbolID": "SUGPUSTR--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.RHD.THT": {
                "symbolID": "SUGPUSTRT-*****",
                "tag": "TPT"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.RHD.CRP": {
                "symbolID": "SUGPUSTRC-*****",  
                "tag": "TPT"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.SPOD": {
                "symbolID": "SUGPUSTS--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.SPOD.THT": {
                "symbolID": "SUGPUSTST-*****",
                "tag": "TPT"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.SPOD.CRP": {
                "symbolID": "SUGPUSTSC-*****",  
                "tag": "TPT"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.APOD": {
                "symbolID": "SUGPUSTA--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.APOD.THT": {
                "symbolID": "SUGPUSTAT-*****",  
                "tag": "TPT"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.APOD.CRP": {
                "symbolID": "SUGPUSTAC-*****",
                "tag": "TPT"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.MSL": {
                "symbolID": "SUGPUSTI--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.TPT.MSL.THT": {
                "symbolID": "SUGPUSTIT-*****",  
                "tag": "TPT"   
            },
            "WAR.GRDTRK.UNT.CSS.TPT.MSL.CRP": {
                "symbolID": "SUGPUSTIC-*****",
                "tag": "TPT"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT": {
                "symbolID": "SUGPUSX---*****",  
                "tag": "UNT"   
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.THT": {
                "symbolID": "SUGPUSXT--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.CRP": {
                "symbolID": "SUGPUSXC--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.HVY": {
                "symbolID": "SUGPUSXH--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.HVY.THT": {
                "symbolID": "SUGPUSXHT-*****",
                "tag": "MAINT"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.HVY.CRP": {
                "symbolID": "SUGPUSXHC-*****",  
                "tag": "MAINT"   
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.RCY": {
                "symbolID": "SUGPUSXR--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.RCY.THT": {
                "symbolID": "SUGPUSXRT-*****",
                "tag": "MAINT"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.RCY.CRP": {
                "symbolID": "SUGPUSXRC-*****",  
                "tag": "MAINT"   
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.ORD": {
                "symbolID": "SUGPUSXO--*****",
                "tag": "CSS"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.ORD.THT": {
                "symbolID": "SUGPUSXOT-*****",  
                "tag": "MAINT"   
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.ORD.CRP": {
                "symbolID": "SUGPUSXOC-*****",
                "tag": "MAINT"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.ORD.MSL": {
                "symbolID": "SUGPUSXOM-*****",
                "tag": "MAINT"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.ORD.MSL.THT": {
                "symbolID": "SUGPUSXOMT*****",  
                "tag": "ORD"   
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.ORD.MSL.CRP": {
                "symbolID": "SUGPUSXOMC*****",
                "tag": "ORD"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.EOP": {
                "symbolID": "SUGPUSXE--*****",  
                "tag": "CSS"   
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.EOP.THT": {
                "symbolID": "SUGPUSXET-*****",
                "tag": "MAINT"     
            },
            "WAR.GRDTRK.UNT.CSS.MAINT.EOP.CRP": {
                "symbolID": "SUGPUSXEC-*****",
                "tag": "MAINT"     
            },
            "WAR.GRDTRK.UNT.C2HQ": {
                "symbolID": "SUGPUH----*****",  
                "tag": "GRDTRK"   
            },
            "WAR.GRDTRK.EQT": {
                "symbolID": "SUGPE-----*****",
                "tag": "WAR"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL": {
                "symbolID": "SUGPEWM---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD": {
                "symbolID": "SUGPEWMA--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.SHTR": {
                "symbolID": "SUGPEWMAS-*****",
                "tag": "MSLL"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.SHTR.TLAR": {
                "symbolID": "SUGPEWMASR*****",  
                "tag": "ADFAD"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.SHTR.TELAR": {
                "symbolID": "SUGPEWMASE*****",
                "tag": "ADFAD"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.INTMR": {
                "symbolID": "SUGPEWMAI-*****",  
                "tag": "MSLL"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.INTMR.TLAR": {
                "symbolID": "SUGPEWMAIR*****",
                "tag": "ADFAD"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.INTMR.TELAR": {
                "symbolID": "SUGPEWMAIE*****",
                "tag": "ADFAD"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.LNGR": {
                "symbolID": "SUGPEWMAL-*****",  
                "tag": "MSLL"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.LNGR.TLAR": {
                "symbolID": "SUGPEWMALR*****",
                "tag": "ADFAD"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.LNGR.TELAR": {
                "symbolID": "SUGPEWMALE*****",  
                "tag": "ADFAD"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.THT": {
                "symbolID": "SUGPEWMAT-*****",
                "tag": "MSLL"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.THT.TLAR": {
                "symbolID": "",
                "tag": "ADFAD"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.ADFAD.THT.TELAR": {
                "symbolID": "SUGPEWMATE*****",  
                "tag": "ADFAD"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.SUF": {
                "symbolID": "SUGPEWMS--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.SUF.SHTR": {
                "symbolID": "SUGPEWMSS-*****",
                "tag": "MSLL"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.SUF.INTMR": {
                "symbolID": "SUGPEWMSI-*****",  
                "tag": "MSLL"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.SUF.LNGR": {
                "symbolID": "SUGPEWMSL-*****",
                "tag": "MSLL"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.AT": {
                "symbolID": "SUGPEWMT--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.AT.LIT": {
                "symbolID": "SUGPEWMTL-*****",
                "tag": "MSLL"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.AT.MDM": {
                "symbolID": "SUGPEWMTM-*****",
                "tag": "MSLL"     
            },
            "WAR.GRDTRK.EQT.WPN.MSLL.AT.HVY": {
                "symbolID": "SUGPEWMTH-*****",  
                "tag": "MSLL"   
            },
            "WAR.GRDTRK.EQT.WPN.SRL": {
                "symbolID": "SUGPEWS---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.WPN.SRL.LIT": {
                "symbolID": "SUGPEWSL--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.SRL.MDM": {
                "symbolID": "SUGPEWSM--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.SRL.HVY": {
                "symbolID": "SUGPEWSH--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.MRL": {
                "symbolID": "SUGPEWX---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.WPN.MRL.LIT": {
                "symbolID": "SUGPEWXL--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.MRL.MDM": {
                "symbolID": "SUGPEWXM--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.MRL.HVY": {
                "symbolID": "SUGPEWXH--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.ATRL": {
                "symbolID": "SUGPEWT---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.WPN.ATRL.LIT": {
                "symbolID": "SUGPEWTL--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.ATRL.MDM": {
                "symbolID": "SUGPEWTM--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.ATRL.HVY": {
                "symbolID": "SUGPEWTH--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.RIFWPN": {
                "symbolID": "SUGPEWR---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.WPN.RIFWPN.RIF": {
                "symbolID": "SUGPEWRR--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.RIFWPN.LMG": {
                "symbolID": "SUGPEWRL--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.RIFWPN.HMG": {
                "symbolID": "SUGPEWRH--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.GREL": {
                "symbolID": "SUGPEWZ---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.WPN.GREL.LIT": {
                "symbolID": "SUGPEWZL--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.GREL.MDM": {
                "symbolID": "SUGPEWZM--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.GREL.HVY": {
                "symbolID": "SUGPEWZH--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.MORT": {
                "symbolID": "SUGPEWO---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.WPN.MORT.LIT": {
                "symbolID": "SUGPEWOL--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.MORT.MDM": {
                "symbolID": "SUGPEWOM--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.MORT.HVY": {
                "symbolID": "SUGPEWOH--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.HOW": {
                "symbolID": "SUGPEWH---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.WPN.HOW.LIT": {
                "symbolID": "SUGPEWHL--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.HOW.LIT.SPD": {
                "symbolID": "SUGPEWHLS-*****",  
                "tag": "HOW"   
            },
            "WAR.GRDTRK.EQT.WPN.HOW.MDM": {
                "symbolID": "SUGPEWHM--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.HOW.MDM.SPD": {
                "symbolID": "SUGPEWHMS-*****",
                "tag": "HOW"     
            },
            "WAR.GRDTRK.EQT.WPN.HOW.HVY": {
                "symbolID": "SUGPEWHH--*****",  
                "tag": "WPN"   
            },
            // "WAR.GRDTRK.EQT.WPN.HOW.HVY": {
            //     "symbolID": "SUGPEWHHS-*****",
            //     "tag": "HOW"     
            // },
            "WAR.GRDTRK.EQT.WPN.ATG": {
                "symbolID": "SUGPEWG---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.WPN.ATG.LIT": {
                "symbolID": "SUGPEWGL--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.ATG.MDM": {
                "symbolID": "SUGPEWGM--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.ATG.HVY": {
                "symbolID": "SUGPEWGH--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.ATG.RECL": {
                "symbolID": "SUGPEWGR--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.DFG": {
                "symbolID": "SUGPEWD---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.WPN.DFG.LIT": {
                "symbolID": "SUGPEWDL--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.DFG.LIT.SPD": {
                "symbolID": "SUGPEWDLS-*****",
                "tag": "DFG"     
            },
            "WAR.GRDTRK.EQT.WPN.DFG.MDM": {
                "symbolID": "SUGPEWDM--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.DFG.MDM.SPD": {
                "symbolID": "SUGPEWDMS-*****",
                "tag": "DFG"     
            },
            "WAR.GRDTRK.EQT.WPN.DFG.HVY": {
                "symbolID": "SUGPEWDH--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.DFG.HVY.SPD": {
                "symbolID": "SUGPEWDHS-*****",
                "tag": "DFG"     
            },
            "WAR.GRDTRK.EQT.WPN.ADFG": {
                "symbolID": "SUGPEWA---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.WPN.ADFG.LIT": {
                "symbolID": "SUGPEWAL--*****",  
                "tag": "WPN"   
            },
            "WAR.GRDTRK.EQT.WPN.ADFG.MDM": {
                "symbolID": "SUGPEWAM--*****",
                "tag": "WPN"     
            },
            "WAR.GRDTRK.EQT.WPN.ADFG.HVY": {
                "symbolID": "SUGPEWAH--*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH": {
                "symbolID": "SUGPEV----*****",
                "tag": "GRDTRK"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD": {
                "symbolID": "SUGPEVA---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.TANK": {
                "symbolID": "SUGPEVAT--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.TANK.LIT": {
                "symbolID": "SUGPEVATL-*****",
                "tag": "ARMD"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.TANK.LIT.RCY": {
                "symbolID": "SUGPEVATLR*****",  
                "tag": "TANK"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.TANK.MDM": {
                "symbolID": "SUGPEVATM-*****",
                "tag": "ARMD"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.TANK.MDM.RCY": {
                "symbolID": "SUGPEVATMR*****",
                "tag": "TANK"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.TANK.HVY": {
                "symbolID": "SUGPEVATH-*****",  
                "tag": "ARMD"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.TANK.HVY.RCY": {
                "symbolID": "SUGPEVATHR*****",
                "tag": "TANK"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.ARMPC": {
                "symbolID": "SUGPEVAA--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.ARMPC.RCY": {
                "symbolID": "SUGPEVAAR-*****",
                "tag": "ARMD"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.ARMINF": {
                "symbolID": "SUGPEVAI--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.C2V": {
                "symbolID": "SUGPEVAC--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.CSSVEH": {
                "symbolID": "SUGPEVAS--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ARMD.LARMVH": {
                "symbolID": "SUGPEVAL--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH": {
                "symbolID": "SUGPEVU---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.BUS": {
                "symbolID": "SUGPEVUB--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.SEMI": {
                "symbolID": "SUGPEVUS--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.SEMI.LIT": {
                "symbolID": "SUGPEVUSL-*****",
                "tag": "UTYVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.SEMI.MDM": {
                "symbolID": "SUGPEVUS--*****",  
                "tag": "UTYVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.SEMI.HVY": {
                "symbolID": "SUGPEVUS--*****",
                "tag": "UTYVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.LCCTRK": {
                "symbolID": "SUGPEVUL--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.CCTRK": {
                "symbolID": "SUGPEVUX--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.H2OCRT": {
                "symbolID": "SUGPEVUR--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.TOWTRK": {
                "symbolID": "SUGPEVUT--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.TOWTRK.LIT": {
                "symbolID": "SUGPEVUTL-*****",
                "tag": "UTYVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.TOWTRK.HVY": {
                "symbolID": "SUGPEVUTH-*****",
                "tag": "UTYVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.AMBLNC": {
                "symbolID": "SUGPEVUA--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.UTYVEH.AMBLNC.ARMD": {
                "symbolID": "SUGPEVUAA-*****",
                "tag": "UTYVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH": {
                "symbolID": "EQT",  
                "tag": "SUGPEVE---*****"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.BRG": {
                "symbolID": "SUGPEVEB--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.ERHMR": {
                "symbolID": "SUGPEVEE--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.CSNVEH": {
                "symbolID": "SUGPEVEC--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MLVEH": {
                "symbolID": "SUGPEVEM--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MLVEH.ARMCV": {
                "symbolID": "SUGPEVEMV-*****",  
                "tag": "ENGVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MLVEH.TRKMV": {
                "symbolID": "SUGPEVEML-*****",
                "tag": "ENGVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MCVEH": {
                "symbolID": "SUGPEVEA--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MCVEH.ARMVM": {
                "symbolID": "SUGPEVEAA-*****",  
                "tag": "ENGVEH"   
            },
            // "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MLVEH.TRKMV": {
            //     "symbolID": "SUGPEVEML-*****",
            //     "tag": "ENGVEH"     
            // },
            // "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MCVEH": {
            //     "symbolID": "SUGPEVEA--*****",  
            //     "tag": "GRDVEH"   
            // },
            // "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MCVEH.ARMVM": {
            //     "symbolID": "SUGPEVEAA-*****",
            //     "tag": "ENGVEH"     
            // },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.MCVEH.TM": {
                "symbolID": "SUGPEVEAT-*****",
                "tag": "ENGVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.DZR": {
                "symbolID": "SUGPEVED--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.DZR.ARMD": {
                "symbolID": "SUGPEVEDA-*****",
                "tag": "ENGVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.AST": {
                "symbolID": "SUGPEVES--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.ARMERV": {
                "symbolID": "SUGPEVER--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.BH": {
                "symbolID": "SUGPEVEH--*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.ENGVEH.FRYTSP": {
                "symbolID": "SUGPEVEF--*****",  
                "tag": "GRDVEH"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.TRNLCO": {
                "symbolID": "SUGPEVT---*****",
                "tag": "GRDVEH"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.CVLVEH": {
                "symbolID": "SUGPEVC---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.CVLVEH.AUT": {
                "symbolID": "SUGPEVCA--*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.CVLVEH.OBTRK": {
                "symbolID": "SUGPEVCO--*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.CVLVEH.MPV": {
                "symbolID": "SUGPEVCM--*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.CVLVEH.UTYVEH": {
                "symbolID": "SUGPEVCU--*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.CVLVEH.JP": {
                "symbolID": "SUGPEVCJ--*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.CVLVEH.TRTRL": {
                "symbolID": "SUGPEVCT--*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.GRDVEH.PKAN": {
                "symbolID": "SUGPEVM---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.GRDVEH.MSLSPT": {
                "symbolID": "SUGPEVS---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.SNS": {
                "symbolID": "SUGPES----*****",  
                "tag": "GRDTRK"   
            },
            "WAR.GRDTRK.EQT.SNS.RAD": {
                "symbolID": "SUGPESR---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.SNS.EMP": {
                "symbolID": "SUGPESE---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.SPL.LSR": {
                "symbolID": "SUGPEXL---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.SPL.NBCEQT": {
                "symbolID": "SUGPEXN---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.SPL.FLMTHR": {
                "symbolID": "SUGPEXF---*****",
                "tag": "EQT"     
            },
            "WAR.GRDTRK.EQT.SPL.LNDMNE": {
                "symbolID": "SUGPEXM---*****",  
                "tag": "EQT"   
            },
            "WAR.GRDTRK.EQT.SPL.LNDMNE.CLM": {
                "symbolID": "SUGPEXMC--*****",
                "tag": "SPL"     
            },
            "WAR.GRDTRK.EQT.SPL.LNDMNE.LTL": {
                "symbolID": "SUGPEXML--*****",  
                "tag": "SPL"   
            },
            "WAR.GRDTRK.INS": {
                "symbolID": "SUGPI-----H****",
                "tag": "WAR"     
            },
            "WAR.GRDTRK.INS.RMP": {
                "symbolID": "SUGPIR----H****",  
                "tag": "GRDTRK"   
            },
            "WAR.GRDTRK.INS.RMP.MNE": {
                "symbolID": "SUGPIRM---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.RMP.PGO": {
                "symbolID": "SUGPIRP---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.RMP.NBC": {
                "symbolID": "SUGPIRN---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.RMP.NBC.BIO": {
                "symbolID": "SUGPIRNB--H****",  
                "tag": "RMP"   
            },
            "WAR.GRDTRK.INS.RMP.NBC.CML": {
                "symbolID": "SUGPIRNC--H****",
                "tag": "RMP"     
            },
            "WAR.GRDTRK.INS.RMP.NBC.NUC": {
                "symbolID": "SUGPIRNN--H****",  
                "tag": "RMP"   
            },
            "WAR.GRDTRK.INS.PF": {
                "symbolID": "SUGPIP----H****",
                "tag": "GRDTRK"     
            },
            "WAR.GRDTRK.INS.PF.DECON": {
                "symbolID": "SUGPIPD---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.EQTMNF": {
                "symbolID": "SUGPIE----H****",
                "tag": "GRDTRK"     
            },
            "WAR.GRDTRK.INS.SRUF": {
                "symbolID": "SUGPIU----H****",  
                "tag": "GRDTRK"   
            },
            "WAR.GRDTRK.INS.SRUF.TRF": {
                "symbolID": "SUGPIUR---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.SRUF.TCF": {
                "symbolID": "SUGPIUT---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.SRUF.EPF": {
                "symbolID": "SUGPIUE---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.SRUF.EPF.NPT": {
                "symbolID": "SUGPIUEN--H****",  
                "tag": "SRUF"   
            },
            "WAR.GRDTRK.INS.SRUF.EPF.DAM": {
                "symbolID": "SUGPIUED--H****",
                "tag": "SRUF"     
            },
            "WAR.GRDTRK.INS.SRUF.EPF.FOSF": {
                "symbolID": "SUGPIUEF--H****",  
                "tag": "SRUF"   
            },
            "WAR.GRDTRK.INS.SRUF.PWS": {
                "symbolID": "SUGPIUP---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.MMF.NENY": {
                "symbolID": "SUGPIMF---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.MMF.NENY.ATMER": {
                "symbolID": "SUGPIMFA--H****",
                "tag": "MMF"     
            },
            "WAR.GRDTRK.INS.MMF.NENY.NMP": {
                "symbolID": "SUGPIMFP--H****",  
                "tag": "MMF"   
            },
            "WAR.GRDTRK.INS.MMF.NENY.NMP.WPNGR": {
                "symbolID": "SUGPIMFPWH****",
                "tag": "NENY"     
            },
            "WAR.GRDTRK.INS.MMF.NENY.NMS": {
                "symbolID": "SUGPIMFS--H****",  
                "tag": "MMF"   
            },
            "WAR.GRDTRK.INS.MMF.APA": {
                "symbolID": "SUGPIMA---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.MMF.AMEP": {
                "symbolID": "SUGPIME---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.MMF.AMTP": {
                "symbolID": "SUGPIMG---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.MMF.MILVP": {
                "symbolID": "SUGPIMV---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.MMF.ENGEP": {
                "symbolID": "SUGPIMN---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.MMF.ENGEP.BRG": {
                "symbolID": "SUGPIMNB--H****",  
                "tag": "MMF"   
            },
            "WAR.GRDTRK.INS.MMF.CBWP": {
                "symbolID": "SUGPIMC---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.MMF.SHPCSN": {
                "symbolID": "SUGPIMS---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.MMF.MSSP": {
                "symbolID": "SUGPIMM---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.GOVLDR": {
                "symbolID": "SUGPIG----H****",  
                "tag": "GRDTRK"   
            },
            "WAR.GRDTRK.INS.MILBF": {
                "symbolID": "SUGPIB----H****",
                "tag": "GRDTRK"     
            },
            "WAR.GRDTRK.INS.MILBF.AB": {
                "symbolID": "SUGPIBA---H****",  
                "tag": "INS"   
            },
            "WAR.GRDTRK.INS.MILBF.SP": {
                "symbolID": "SUGPIBN---H****",
                "tag": "INS"     
            },
            "WAR.GRDTRK.INS.TSPF": {
                "symbolID": "SUGPIT----H****",  
                "tag": "GRDTRK"   
            },
            "WAR.GRDTRK.INS.MEDF": {
                "symbolID": "SUGPIX----H****",
                "tag": "GRDTRK"     
            },
            "WAR.GRDTRK.INS.MEDF.HSP": {
                "symbolID": "SUGPIXH---H****",  
                "tag": "INS"   
            }
        },

        "sea": {
            "WAR.SSUF": {
                "symbolID": "SUSP------*****",
                "tag": "WAR"     
            },
            "WAR.SSUF.CBTT": {
                "symbolID": "SUSPC-----*****",  
                "tag": "WAR"   
            },
            "WAR.SSUF.CBTT.LNE": {
                "symbolID": "SUSPCL----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.CBTT.LNE.CRR": {
                "symbolID": "SUSPCLCV--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.LNE.BBS": {
                "symbolID": "SUSPCLBB--*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.LNE.CRU": {
                "symbolID": "SUSPCLCC--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.LNE.DD": {
                "symbolID": "SUSPCLDD--*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.LNE.FFR": {
                "symbolID": "SUSPCLFF--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.AMPWS": {
                "symbolID": "SUSPCA----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.CBTT.AMPWS.ASTVES": {
                "symbolID": "SUSPCALA--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.AMPWS.LNDSHP": {
                "symbolID": "SUSPCALS--*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.AMPWS.LNDSHP.MDM": {
                "symbolID": "SUSPCALSM-*****",  
                "tag": "AMPWS"   
            },
            "WAR.SSUF.CBTT.AMPWS.LNDSHP.TANK": {
                "symbolID": "SUSPCALST-*****",
                "tag": "AMPWS"     
            },
            "WAR.SSUF.CBTT.AMPWS.LNDCRT": {
                "symbolID": "SUSPCALC--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.MNEWV": {
                "symbolID": "SUSPCM----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.CBTT.MNEWV.MNELYR": {
                "symbolID": "SUSPCMML--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.MNEWV.MNESWE": {
                "symbolID": "SUSPCMMS--*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.MNEWV.MNEHNT": {
                "symbolID": "SUSPCMMH--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.MNEWV.MCMSUP": {
                "symbolID": "SUSPCMMA--*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.MNEWV.MCMDRN": {
                "symbolID": "SUSPCMMD--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.PAT": {
                "symbolID": "SUSPCP----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.CBTT.PAT.ASBW": {
                "symbolID": "SUSPCPSB--*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.PAT.ASUW": {
                "symbolID": "SUSPCPSU--*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.HOV": {
                "symbolID": "SUSPCH----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.CBTT.STN": {
                "symbolID": "SUSPS-----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.CBTT.STN.PKT": {
                "symbolID": "SUSPSP----*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.STN.ASWSHP": {
                "symbolID": "SUSPSA----*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.NAVGRP": {
                "symbolID": "SUSPG-----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.CBTT.NAVGRP.NAVTF": {
                "symbolID": "SUSPGT----*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.NAVGRP.NAVTG": {
                "symbolID": "SUSPGG----*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.CBTT.NAVGRP.NAVTU": {
                "symbolID": "SUSPGU----*****",
                "tag": "CBTT"     
            },
            "WAR.SSUF.CBTT.NAVGRP.CNY": {
                "symbolID": "SUSPGC----*****",  
                "tag": "CBTT"   
            },
            "WAR.SSUF.NCBTT": {
                "symbolID": "SUSPN-----*****",
                "tag": "WAR"     
            },
            "WAR.SSUF.NCBTT.UWRPM": {
                "symbolID": "SUSPNR----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.NCBTT.FLTSUP": {
                "symbolID": "SUSPNF----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.NCBTT.INT": {
                "symbolID": "SUSPNI----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.NCBTT.SSH": {
                "symbolID": "SUSPNS----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.NCBTT.HSPSHP": {
                "symbolID": "SUSPNM----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.NCBTT.HOV": {
                "symbolID": "SUSPNH----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.NCBTT.STN": {
                "symbolID": "SUSPNN----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.NCBTT.STN.RSC": {
                "symbolID": "SUSPNNR---*****",
                "tag": "NCBTT"     
            },
            "WAR.SSUF.NMIL": {
                "symbolID": "N/A",  
                "tag": "WAR"   
            },
            "WAR.SSUF.NMIL.MCT": {
                "symbolID": "SUSPXM----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.NMIL.MCT.CGO": {
                "symbolID": "SUSPXMC---*****",  
                "tag": "NMIL"   
            },
            "WAR.SSUF.NMIL.MCT.RORO": {
                "symbolID": "SUSPXMR---*****",
                "tag": "NMIL"     
            },
            "WAR.SSUF.NMIL.MCT.OLR": {
                "symbolID": "SUSPXMO---*****",  
                "tag": "NMIL"   
            },
            "WAR.SSUF.NMIL.MCT.TUG": {
                "symbolID": "SUSPXMTU--*****",
                "tag": "NMIL"     
            },
            "WAR.SSUF.NMIL.MCT.FRY": {
                "symbolID": "SUSPXMF---*****",  
                "tag": "NMIL"   
            },
            "WAR.SSUF.NMIL.MCT.PSG": {
                "symbolID": "SUSPXMP---*****",
                "tag": "NMIL"     
            },
            "WAR.SSUF.NMIL.MCT.HAZMAT": {
                "symbolID": "SUSPXMH---*****",  
                "tag": "NMIL"   
            },
            "WAR.SSUF.NMIL.MCT.TOWVES": {
                "symbolID": "SUSPXMTO--*****",
                "tag": "NMIL"     
            },
            "WAR.SSUF.NMIL.FSG": {
                "symbolID": "SUSPXF----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.NMIL.FSG.DRFT": {
                "symbolID": "SUSPXFDF--*****",
                "tag": "NMIL"     
            },
            "WAR.SSUF.NMIL.FSG.DRG": {
                "symbolID": "SUSPXFDR--*****",  
                "tag": "NMIL"   
            },
            "WAR.SSUF.NMIL.FSG.TRW": {
                "symbolID": "SUSPXFTR--*****",
                "tag": "NMIL"     
            },
            "WAR.SSUF.NMIL.LESCRT": {
                "symbolID": "SUSPXR----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.NMIL.LAWENV": {
                "symbolID": "SUSPXL----*****",
                "tag": "SSUF"     
            },
            "WAR.SSUF.NMIL.HOV": {
                "symbolID": "SUSPXH----*****",  
                "tag": "SSUF"   
            },
            "WAR.SSUF.OWN": {
                "symbolID": "SUSPO-----*****",
                "tag": "WAR"     
            },
        },

        "subsurface": {
            "WAR.SBSUF": {
                "symbolID": "SUUP------*****",  
                "tag": "WAR"   
            },
            "WAR.SBSUF.SUB": {
                "symbolID": "SUUPS-----*****",
                "tag": "WAR"     
            },
            "WAR.SBSUF.SUB.NPRN": {
                "symbolID": "SUUPSN----*****",  
                "tag": "SBSUF"   
            },
            "WAR.SBSUF.SUB.NPRN.ATK": {
                "symbolID": "SUUPSNA---*****",
                "tag": "SUB"     
            },
            "WAR.SBSUF.SUB.NPRN.MSL": {
                "symbolID": "SUUPSNM---*****",  
                "tag": "SUB"   
            },
            "WAR.SBSUF.SUB.NPRN.GDD": {
                "symbolID": "SUUPSNG---*****",
                "tag": "SUB"     
            },
            "WAR.SBSUF.SUB.CNVPRN.BLST": {
                "symbolID": "SUUPSCB---*****",  
                "tag": "SUB"   
            },
            "WAR.SBSUF.SUB.OTH": {
                "symbolID": "SUUPSO----*****",
                "tag": "SBSUF"     
            },
            "WAR.SBSUF.SUB.OTH.UUV": {
                "symbolID": "SUUPSU----*****",  
                "tag": "SUB"   
            },
            "WAR.SBSUF.SUB.STN": {
                "symbolID": "SUUPSS----*****",
                "tag": "SBSUF"     
            },
            "WAR.SBSUF.SUB.STN.ASWSUB": {
                "symbolID": "SUUPSSA---*****",  
                "tag": "SUB"   
            },
            "WAR.SBSUF.UH2WPN": {
                "symbolID": "SUUPW-----*****",
                "tag": "WAR"     
            },
            "WAR.SBSUF.UH2WPN.TPD": {
                "symbolID": "SUUPWT----*****",  
                "tag": "SBSUF"   
            },
            "WAR.SBSUF.UH2WPN.SMNE": {
                "symbolID": "SUUPWM----*****",
                "tag": "SBSUF"     
            },
            "WAR.SBSUF.UH2WPN.SMNE.DLT": {
                "symbolID": "SUUPWMD---*****",  
                "tag": "UH2WPN"   
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMG": {
                "symbolID": "SUUPWMG---*****",
                "tag": "UH2WPN"     
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMG.DLT": {
                "symbolID": "SUUPWMGD--*****",  
                "tag": "SMNE"   
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMM": {
                "symbolID": "SUUPWMM---*****",
                "tag": "UH2WPN"     
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMM.DLT": {
                "symbolID": "SUUPWMMD--*****",  
                "tag": "SMNE"   
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMF": {
                "symbolID": "SUUPWMF---*****",
                "tag": "UH2WPN"     
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMF.DLT": {
                "symbolID": "SUUPWMFD--*****",  
                "tag": "SMNE"   
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMOP": {
                "symbolID": "SUUPWMO---*****",
                "tag": "UH2WPN"     
            },
            "WAR.SBSUF.UH2WPN.SMNE.SMOP.DLT": {
                "symbolID": "SUUPWMOD--*****",  
                "tag": "SMNE"   
            },
            "WAR.SBSUF.UH2DCY": {
                "symbolID": "SUUPWD----*****",
                "tag": "WAR"     
            },
            "WAR.SBSUF.UH2DCY.SMDCY": {
                "symbolID": "SUUPWDM---*****",  
                "tag": "SBSUF"   
            },
            "WAR.SBSUF.NSUB": {
                "symbolID": "N/A",
                "tag": "WAR"     
            },
            "WAR.SBSUF.NSUB.DVR": {
                "symbolID": "SUUPND----*****",  
                "tag": "SBSUF"   
            },
        },

        "sof": {
            "WAR.SOFUNT": {
                "symbolID": "SUFP------*****",
                "tag": "WAR"     
            },
            "WAR.SOFUNT.AVN": {
                "symbolID": "SUFPA-----*****",  
                "tag": "WAR"   
            },
            "WAR.SOFUNT.AVN.FIXD": {
                "symbolID": "SUFPAF----*****",
                "tag": "SOFUNT"     
            },
            "WAR.SOFUNT.AVN.FIXD.ATK": {
                "symbolID": "SUFPAFA---*****",  
                "tag": "AVN"   
            },
            "WAR.SOFUNT.AVN.FIXD.RFE": {
                "symbolID": "SUFPAFK---*****",
                "tag": "AVN"     
            },
            "WAR.SOFUNT.AVN.FIXD.UTY": {
                "symbolID": "SUFPAFU---*****",  
                "tag": "AVN"   
            },
            "WAR.SOFUNT.AVN.FIXD.UTY.LIT": {
                "symbolID": "SUFPAFUL--*****",
                "tag": "FIXD"     
            },
            "WAR.SOFUNT.AVN.FIXD.UTY.MDM": {
                "symbolID": "SUFPAFUM--*****",  
                "tag": "FIXD"   
            },
            "WAR.SOFUNT.AVN.FIXD.UTY.HVY": {
                "symbolID": "SUFPAFUH--*****",
                "tag": "FIXD"     
            },
            "WAR.SOFUNT.AVN.VSTOL": {
                "symbolID": "SUFPAV----*****",  
                "tag": "SOFUNT"   
            },
            "WAR.SOFUNT.AVN.ROT": {
                "symbolID": "SUFPAH----*****",
                "tag": "SOFUNT"     
            },
            "WAR.SOFUNT.AVN.ROT.CSAR": {
                "symbolID": "SUFPAHH---*****",  
                "tag": "AVN"   
            },
            "WAR.SOFUNT.AVN.ROT.ATK": {
                "symbolID": "SUFPAHA---*****",
                "tag": "AVN"     
            },
            "WAR.SOFUNT.AVN.ROT.UTY": {
                "symbolID": "SUFPAHU---*****",  
                "tag": "AVN"   
            },
            "WAR.SOFUNT.AVN.ROT.UTY.LIT": {
                "symbolID": "SUFPAHUL--*****",
                "tag": "ROT"     
            },
            "WAR.SOFUNT.AVN.ROT.UTY.MDM": {
                "symbolID": "SUFPAHUM--*****",  
                "tag": "ROT"   
            },
            "WAR.SOFUNT.AVN.ROT.UTY.HVY": {
                "symbolID": "SUFPAHUH--*****",
                "tag": "ROT"     
            },
            "WAR.SOFUNT.NAV": {
                "symbolID": "SUFPN-----*****",  
                "tag": "WAR"   
            },
            "WAR.SOFUNT.NAV.SEAL": {
                "symbolID": "SUFPNS----*****",
                "tag": "SOFUNT"     
            },
            "WAR.SOFUNT.NAV.UH2DML": {
                "symbolID": "SUFPNU----*****",  
                "tag": "SOFUNT"   
            },
            "WAR.SOFUNT.NAV.SBT": {
                "symbolID": "SUFPNB----*****",
                "tag": "SOFUNT"     
            }, 
            "WAR.SOFUNT.NAV.SSSNR": {
                "symbolID": "SUFPNN----*****",  
                "tag": "SOFUNT"   
            },
            "WAR.SOFUNT.GRD": {
                "symbolID": "SUFPG-----*****",
                "tag": "WAR"     
            },
            "WAR.SOFUNT.GRD.SOF": {
                "symbolID": "SUFPGS----*****",  
                "tag": "SOFUNT"   
            },
            "WAR.SOFUNT.GRD.RGR": {
                "symbolID": "SUFPGR----*****",
                "tag": "SOFUNT"     
            }, 
            "WAR.SOFUNT.GRD.PSYOP": {
                "symbolID": "SUFPGP----*****",  
                "tag": "SOFUNT"   
            },
            "WAR.SOFUNT.GRD.PSYOP.FIXAVN": {
                "symbolID": "SUFPGPA---*****",
                "tag": "GRD"     
            },
            "WAR.SOFUNT.GRD.CVLAFF": {
                "symbolID": "SUFPGC----*****",  
                "tag": "SOFUNT"   
            },
            "WAR.SOFUNT.SUP": {
                "symbolID": "SUFPB-----*****",
                "tag": "WAR"     
            }
        },

        // Task point Tactical Graphics
        "task": {
            "TACGRP.TSK.DSTY": {
                "symbolID": "GUTPD-----****X",
                "tag": "TACGRP"
            },
            "TACGRP.TSK.ITDT": {
                "symbolID": "GUTPI-----****X",
                "tag": "TACGRP"
            },
            "TACGRP.TSK.NEUT": {
                "symbolID": "GUTPN-----****X",
                "tag": "TACGRP"
            }
        },
        
        // Command Control General Maneuver point Tactical Graphics
        "c2gm": {
            "TACGRP.C2GM.GNL.PNT.REFPNT": {
                "symbolID": "GUGPGPR---****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.NAVREF": {
                "symbolID": "GUGPGPRN--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.SPLPNT": {
                "symbolID": "GUGPGPRS--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.DLRP": {
                "symbolID": "GUGPGPRD--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.PIM": {
                "symbolID": "GUGPGPRP--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.MRSH": {
                "symbolID": "GUGPGPRM--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.WAP": {
                "symbolID": "GUGPGPRW--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.CRDRTB": {
                "symbolID": "GUGPGPRC--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.REFPNT.PNTINR": {
                "symbolID": "GUGPGPRI--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.WPN.AIMPNT": {
                "symbolID": "GUGPGPWA--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.WPN.DRPPNT": {
                "symbolID": "GUGPGPWD--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.WPN.ENTPNT": {
                "symbolID": "GUGPGPWE--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.WPN.GRDZRO": {
                "symbolID": "GUGPGPWG--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.WPN.MSLPNT": {
                "symbolID": "GUGPGPWM--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.WPN.IMTPNT": {
                "symbolID": "GUGPGPWI--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.WPN.PIPNT": {
                "symbolID": "GUGPGPWP--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.FRMN": {
                "symbolID": "GUGPGPF---****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.HBR": {
                "symbolID": "GUGPGPH---****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.HBR.PNTQ": {
                "symbolID": "GUGPGPHQ--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.HBR.PNTA": {
                "symbolID": "GUGPGPHA--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.HBR.PNTX": {
                "symbolID": "GUGPGPHX--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.RTE": {
                "symbolID": "GUGPGPO---****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.RTE.RDV": {
                "symbolID": "GUGPGPOZ--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.RTE.DVSN": {
                "symbolID": "GUGPGPOD--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.RTE.WAP": {
                "symbolID": "GUGPGPOW--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.RTE.PIM": {
                "symbolID": "GUGPGPOP--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.RTE.PNTR": {
                "symbolID": "GUGPGPOR--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT": {
                "symbolID": "GUGPGPP---****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.CHKPNT": {
                "symbolID": "GUGPGPPK--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.CONPNT": {
                "symbolID": "GUGPGPPC--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.CRDPNT": {
                "symbolID": "GUGPGPPO--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.DCNPNT": {
                "symbolID": "GUGPGPPD--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.LNKUPT": {
                "symbolID": "GUGPGPPL--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.PSSPNT": {
                "symbolID": "GUGPGPPP--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.RAYPNT": {
                "symbolID": "GUGPGPPR--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.RELPNT": {
                "symbolID": "GUGPGPPE--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.STRPNT": {
                "symbolID": "GUGPGPPS--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.AMNPNT": {
                "symbolID": "GUGPGPPA--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.GNL.PNT.ACTPNT.WAP": {
                "symbolID": "GUGPGPPW--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.DEF.PNT.TGTREF": {
                "symbolID": "GUGPDPT---****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.DEF.PNT.OBSPST": {
                "symbolID": "GUGPDPO---****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.DEF.PNT.OBSPST.CBTPST": {
                "symbolID": "GUGPDPOC--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.DEF.PNT.OBSPST.RECON": {
                "symbolID": "GUGPDPOR--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.DEF.PNT.OBSPST.FWDOP": {
                "symbolID": "GUGPDPOF--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.DEF.PNT.OBSPST.SOP": {
                "symbolID": "GUGPDPOS--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.DEF.PNT.OBSPST.CBRN": {
                "symbolID": "GUGPDPON--****X",
                "tag": "TACGRP"
            },
            "TACGRP.C2GM.OFF.PNT.PNTD": {
                "symbolID": "GUGPOPP---****X",
                "tag": "TACGRP"
            }
        },
        
        // Mobility/Survivability point Tactical Graphics
        "mobsu": {
            "TACGRP.MOBSU.OBST.ATO.TDTSM.FIXPFD": {
                "symbolID": "GUMPOAOF--****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.ATO.TDTSM.MVB": {
                "symbolID": "GUMPOAOM--****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.ATO.TDTSM.MVBPFD": {
                "symbolID": "GUMPOAOP--****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.BBY": {
                "symbolID": "GUMPOB----****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.MNE.USPMNE": {
                "symbolID": "GUMPOMU---****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.MNE.ATMNE": {
                "symbolID": "GUMPOMT---****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.MNE.ATMAHD": {
                "symbolID": "GUMPOMD---****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.MNE.ATMDIR": {
                "symbolID": "GUMPOME---****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.MNE.APMNE": {
                "symbolID": "GUMPOMP---****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBST.MNE.WAMNE": {
                "symbolID": "GUMPOMW---****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.OBSTBP.CSGSTE.ERP": {
                "symbolID": "GUMPBCP---****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.SU.ESTOF": {
                "symbolID": "GUMPSE----****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.SU.FRT": {
                "symbolID": "GUMPSF----****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.SU.SUFSHL": {
                "symbolID": "GUMPSS----****X",
                "tag": "TACGRP"
            },
            "TACGRP.MOBSU.SU.UGDSHL": {
                "symbolID": "GUMPSU----****X",
                "tag": "TACGRP"
            }
        },

        // Fire Support point Tactical Graphics        
        "fsupp": {
            "TACGRP.FSUPP.PNT.TGT.PTGT": {
                "symbolID": "GUFPPTS---****X",
                "tag": "TACGRP"
            },
            "TACGRP.FSUPP.PNT.TGT.NUCTGT": {
                "symbolID": "GUFPPTN---****X",
                "tag": "TACGRP"
            },
            "TACGRP.FSUPP.PNT.C2PNT.FSS": {
                "symbolID": "GUFPPCF---****X",
                "tag": "TACGRP"
            },
            "TACGRP.FSUPP.PNT.C2PNT.SCP": {
                "symbolID": "GUFPPCS---****X",
                "tag": "TACGRP"
            },
            "TACGRP.FSUPP.PNT.C2PNT.FP": {
                "symbolID": "GUFPPCB---****X",
                "tag": "TACGRP"
            },
            "TACGRP.FSUPP.PNT.C2PNT.RP": {
                "symbolID": "GUFPPCR---****X",
                "tag": "TACGRP"
            },
            "TACGRP.FSUPP.PNT.C2PNT.HP": {
                "symbolID": "GUFPPCH---****X",
                "tag": "TACGRP"
            },
            "TACGRP.FSUPP.PNT.C2PNT.LP": {
                "symbolID": "GUFPPCL---****X",
                "tag": "TACGRP"
            }
        },
        
        // Combat Service Support point Tactical Graphics
        "css": {
            "TACGRP.CSS.PNT.AEP": {
                "symbolID": "GUSPPX----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.CBNP": {
                "symbolID": "GUSPPC----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.CCP": {
                "symbolID": "GUSPPY----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.CVP": {
                "symbolID": "GUSPPT----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.DCP": {
                "symbolID": "GUSPPD----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.EPWCP": {
                "symbolID": "GUSPPE----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.LRP": {
                "symbolID": "GUSPPL----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.MCP": {
                "symbolID": "GUSPPM----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.RRRP": {
                "symbolID": "GUSPPR----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.ROM": {
                "symbolID": "GUSPPU----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.TCP": {
                "symbolID": "GUSPPO----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.TTP": {
                "symbolID": "GUSPPI----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.UMC": {
                "symbolID": "GUSPPN----****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.GNL": {
                "symbolID": "GUSPPSZ---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS1": {
                "symbolID": "GUSPPSA---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS2": {
                "symbolID": "GUSPPSB---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS3": {
                "symbolID": "GUSPPSC---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS4": {
                "symbolID": "GUSPPSD---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS5": {
                "symbolID": "GUSPPSE---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS6": {
                "symbolID": "GUSPPSF---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS7": {
                "symbolID": "GUSPPSG---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS8": {
                "symbolID": "GUSPPSH---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS9": {
                "symbolID": "GUSPPSI---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.SPT.CLS10": {
                "symbolID": "GUSPPSJ---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.AP.ASP": {
                "symbolID": "GUSPPAS---****X",
                "tag": "TACGRP"
            },
            "TACGRP.CSS.PNT.AP.ATP": {
                "symbolID": "GUSPPAT---****X",
                "tag": "TACGRP"
            }
        },
                
        // Stabilizing Operations point graphics
        "stbops": {
            "STBOPS.VIOATY.ASN": {
                "symbolID": "OUVPA-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.KILL": {
                "symbolID": "OUVPM-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.KILL.MDR": {
                "symbolID": "OUVPMA----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.KILL.EX": {
                "symbolID": "OUVPMB----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.KILL.ASS": {
                "symbolID": "OUVPMC----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.BM": {
                "symbolID": "OUVPB-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.BBY": {
                "symbolID": "OUVPY-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.DBS": {
                "symbolID": "OUVPD-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.SPG": {
                "symbolID": "OUVPS-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.PSNG": {
                "symbolID": "OUVPP-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.EXPLSN": {
                "symbolID": "OUVPE-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.VIOATY.EXPLSN.EXPLSN": {
                "symbolID": "OUVPEI----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.LOCAT.BLST": {
                "symbolID": "OULPB-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.LOCAT.GLST": {
                "symbolID": "OULPG-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.LOCAT.WLST": {
                "symbolID": "OULPW-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.LOCAT.MASS": {
                "symbolID": "OULPM-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.PATG": {
                "symbolID": "OUOPP-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.DEMO": {
                "symbolID": "OUOPD-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.ML": {
                "symbolID": "OUOPM-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.FRGSRH": {
                "symbolID": "OUOPF-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.SPY": {
                "symbolID": "OUOPS-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.FDDIST": {
                "symbolID": "OUOPO-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.EXTN": {
                "symbolID": "OUOPE-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.HJKG.VEH": {
                "symbolID": "OUOPHT----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.HJKG.APL": {
                "symbolID": "OUOPHA----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.HJKG.BOAT": {
                "symbolID": "OUOPHV----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.KDNG": {
                "symbolID": "OUOPK-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.KDNG.ATEMPT": {
                "symbolID": "OUOPK-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.ARR": {
                "symbolID": "OUOPA-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.OPN.DGOPN": {
                "symbolID": "OUOPU-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.ITM.RFG": {
                "symbolID": "OUIPR-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.ITM.SAFHSE": {
                "symbolID": "OUIPS-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.ITM.GRF": {
                "symbolID": "OUIPG-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.ITM.VRLRPS": {
                "symbolID": "OUIPV-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.ITM.KNIVEH": {
                "symbolID": "OUIPI-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.ITM.DGVEH": {
                "symbolID": "OUIPD-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.ITM.ISF": {
                "symbolID": "OUIPF-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.INDIV": {
                "symbolID": "OUPP------*****",
                "tag": "STBOPS"     
            },
            "STBOPS.INDIV.LEADER": {
                "symbolID": "OUPPA-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.INDIV.TRGTD": {
                "symbolID": "OUPPB-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.INDIV.TERRST": {
                "symbolID": "OUPPC-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.GRPORG": {
                "symbolID": "OUGP------*****",
                "tag": "STBOPS"     
            },
            "STBOPS.GRPORG.DPRE": {
                "symbolID": "OUGPA-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.GRPORG.NGO": {
                "symbolID": "OUGPB-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.GRPORG.TERRST": {
                "symbolID": "OUGPC-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.GRPORG.RELIGS": {
                "symbolID": "OUGPD-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.GRPORG.FNFGHT": {
                "symbolID": "OUGPE-----*****",
                "tag": "STBOPS"     
            },
            "STBOPS.GRPORG.GANG": {
                "symbolID": "OUGPF-----*****",
                "tag": "STBOPS"     
            }
        },
        
        // Emergency Management Services point graphics
        "ems": {
            "EMS.OPN.EMMED": {
                "symbolID": "EUOPA-----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.EMOPN": {
                "symbolID": "EUOPB-----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.FIRFT": {
                "symbolID": "EUOPC-----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF": {
                "symbolID": "EUOPD-----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.ATF": {
                "symbolID": "EUOPDD----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.BDRPT": {
                "symbolID": "EUOPDE----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.CSTM": {
                "symbolID": "EUOPDF----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.DEA": {
                "symbolID": "EUOPDG----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.DOJ": {
                "symbolID": "EUOPDH----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.FBI": {
                "symbolID": "EUOPDI----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.POL": {
                "symbolID": "EUOPDJ----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.PRSN": {
                "symbolID": "EUOPDK----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.SECSR": {
                "symbolID": "EUOPDL----*****",
                "tag": "EMS"     
            },
             "EMS.OPN.LAWENF.TSA": {
                "symbolID": "EUOPDM----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.CSTGD": {
                "symbolID": "EUOPDN----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.LAWENF.USMAR": {
                "symbolID": "EUOPDO----*****",
                "tag": "EMS"     
            },
            "EMS.OPN.SNS": {
                "symbolID": "EUOPE-----*****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.AGFD": {
                "symbolID": "EUFPA-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.BFI": {
                "symbolID": "EUFPB-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.CMCL": {
                "symbolID": "EUFPC-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.EDFAC": {
                "symbolID": "EUFPD-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.ENGFAC": {
                "symbolID": "EUFPE-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.GVTSTE": {
                "symbolID": "EUFPF-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.MIL": {
                "symbolID": "EUFPG-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.PSTSRV": {
                "symbolID": "EUFPH-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.PUBVEN": {
                "symbolID": "EUFPI-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.SPCNDS": {
                "symbolID": "EUFPJ-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.TELCOM": {
                "symbolID": "EUFPK-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.TSP": {
                "symbolID": "EUFPL-----H****",
                "tag": "EMS"     
            },
            "EMS.INFSTR.WS": {
                "symbolID": "EUFPM-----H****",
                "tag": "EMS"     
            }
       },

       "tacticalTasks": {
            "TACGRP.TSK.CNT": {
                  "symbolID": "G*TPJ-----****X",
                  "tag": "CONTAIN",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 50,100, 50,0, 100,50 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.BRH": {
                  "symbolID": "G*TPH-----****X",
                  "tag": "BREACH",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50  ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.BYS": {
                  "symbolID": "G*TPY-----****X",
                  "tag": "BYPASS",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50  ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.CNZ": {
                  "symbolID": "G*TPC-----****X",
                  "tag": "CANALIZE",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.CLR": {
                  "symbolID": "G*TPX-----****X",
                  "tag": "CLEAR",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.PNE": {
                  "symbolID": "G*TPP-----****X",
                  "tag": "PENETRATE",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.ISL": {
                  "symbolID": "G*TPE-----****X",
                  "tag": "ISOLATE",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 50,50, 0,50, 0,100, 100,100 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.OCC": {
                  "symbolID": "G*TPO-----****X",
                  "tag": "OCCUPY",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 50,50, 0,50, 0,100, 100,100 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.SCE": {
                  "symbolID": "G*TPS-----****X",
                  "tag": "SECURE",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 50,50, 0,50, 0,100, 100,100 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.RTN": {
                  "symbolID": "G*TPQ-----****X",
                  "tag": "RETAIN",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 50,50, 0,50, 0,100, 100,100 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.C2GM.GNL.ARS.SRHARA": {
                  "symbolID": "G*GPGAS---****X",
                  "tag": "RECONNAISSANCE",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 10,40, 100,80, 100,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.FLWASS.FLWASS": {
                  "symbolID": "G*TPA-----****X",
                  "tag": "FOLLOW AND ASSUME",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,100, 100,0, 0,0 ],
                  "defaultDimensions": [100, 20],
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.TSK.FLWASS.FLWSUP": {
                  "symbolID": "G*TPAS----****X",
                  "tag": "FOLLOW AND SUPPORT",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,100, 100,0, 0,0 ],
                  "defaultDimensions": [100, 20],
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.TSK.SZE": {
                  "symbolID": "G*TPZ-----****X",
                  "tag": "SEIZE",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 10,50, 100,90, 20,10 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.DLY": {
                  "symbolID": "G*TPL-----****X",
                  "tag": "DELAY",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,80, 80,80, 80,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.RTM": {
                  "symbolID": "G*TPM-----****X",
                  "tag": "RETIREMENT",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,80, 80,80, 80,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.WDR": {
                  "symbolID": "G*TPW-----****X",
                  "tag": "WITHDRAW",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,80, 80,80, 80,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.WDR.WDRUP": {
                  "symbolID": "G*TPWP----****X",
                  "tag": "WITHDRAW UNDER PRESSURE",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,80, 80,80, 80,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.RIP": {
                  "symbolID": "G*TPR-----****X",
                  "tag": "RELIEF IN PLACE",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,80, 80,80, 80,1, 0,1 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.TSK.SEC.SCN": {
                  "symbolID": "G*TPUS----****X",
                  "tag": "SCREEN",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,10, 50,0, 50,0, 100,10 ],
                  "defaultDimensions": [100, 10]
            },
            "TACGRP.TSK.SEC.GUD": {
                  "symbolID": "G*TPUG----****X",
                  "tag": "GUARD",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,10, 50,0, 50,0, 100,10 ],
                  "defaultDimensions": [100, 10]
            },
            "TACGRP.TSK.SEC.COV": {
                  "symbolID": "G*TPUC----****X",
                  "tag": "COVER",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,10, 50,0, 50,0, 100,10 ],
                  "defaultDimensions": [100, 10]
            }
       },

       "obstacleEffects": {
            "TACGRP.MOBSU.OBST.OBSEFT.BLK": {
                  "symbolID": "G*TPB-----****X",
                  "tag": "BLOCK",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.MOBSU.OBST.OBSEFT.DRT": {
                  "symbolID": "G*MPOED---****X",
                  "tag": "DISRUPT",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 0,0, 0,100, 100,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.MOBSU.OBST.OBSEFT.FIX": {
                  "symbolID": "G*MPOEF---****X",
                  "tag": "FIX",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 100,0, 0,0, 100,100 ],
                  "defaultDimensions": [100, 20]
            }
       },

       "obstacleBypass": {
            "TACGRP.MOBSU.OBSTBP.DFTY.DFT": {
                  "symbolID": "G*MPBDD---****X",
                  "tag": "BYPASS DIFFICULT",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50  ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.MOBSU.OBSTBP.DFTY.IMP": {
                  "symbolID": "G*MPBDI---****X",
                  "tag": "BYPASS IMPOSSIBLE",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,100, 100,0, 0,50  ],
                  "defaultDimensions": [100, 100]
            }
       },

       "maneuvers": {
            "TACGRP.C2GM.OFF.ARS.SFP": {
                  "symbolID": "G*GPOAS---****X",
                  "tag": "SUPPORT BY FIRE POSITION",
                  "symbolType": "DefinedMissionGraphic",                  
                  "defaultControlPts": [ 0,80, 0,20, 100,100, 100,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.C2GM.SPL.LNE.AMB": {
                  "symbolID": "G*GPSLA---****X",
                  "tag": "AMBUSH",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,50, 0,100, 0,0 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.C2GM.OFF.ARS.AFP": {
                  "symbolID": "G*GPOAF---****X",
                  "tag": "ATTACK BY FIRE POSITION",
                  "symbolType": "DefinedMissionGraphic", 
                  "defaultControlPts": [ 100,50, 0,80, 0,20 ],
                  "defaultDimensions": [100, 100]
            },
            "TACGRP.C2GM.OFF.LNE.DIRATK.GRD.MANATK": {
                  "symbolID": "G*GPOLKGM-****X",
                  "tag": "GROUND MAIN ATTACK",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 100,0, 0,0, 100,100 ],
                  "defaultDimensions": [100, 20]
            },
            "TACGRP.C2GM.OFF.LNE.DIRATK.GRD.UPATK": {
                  "symbolID": "G*GPOLKGS-****X",
                  "tag": "GROUND SUPPORTING ATTACK",
                  "symbolType": "DefinedMissionGraphic",
                  "defaultControlPts": [ 100,0, 0,0, 100,100 ],
                  "defaultDimensions": [100, 20]
            },
            "TACGRP.C2GM.OFF.LNE.DIRATK.GRD.MANATK": {
                  "symbolID": "G*GPOLKGM-****X",
                  "tag": "DIRECTION OF MAIN ATTACK",
                  "symbolType": "SimpleArrow"
            },
            "TACGRP.C2GM.OFF.LNE.DIRATK.GRD.SUPATK": {
                  "symbolID": "G*GPOLKGS-****X",
                  "tag": "DIRECTION OF SUPPORTING ATTACK",
                  "symbolType": "SimpleArrow"
            },
            "TACGRP.C2GM.DCPN.DAFF": {
                  "symbolID": "G*GPPF----****X",
                  "tag": "DIRECTION OF ATTACK FOR FEINT",
                  "symbolType": "SimpleArrow"
            },
            "TACGRP.C2GM.OFF.LNE.DIRATK.AVN": {
                  "symbolID": "G*GPOLKA--****X",
                  "tag": "DIRECTION OF ATTACK AVIATION",
                  "symbolType": "SimpleArrow"
            }
       },

       "lines": {
            "TACGRP.C2GM.GNL.LNE.PHELNE": {
                  "symbolID": "G*GPGLP---****X",
                  "tag": "PHASE LINE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.C2GM.GNL.LNE.LITLNE": {
                  "symbolID": "G*GPGLL---****X",
                  "tag": "LIGHT LINE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.C2GM.OFF.LNE.PLD": {
                  "symbolID": "G*GPOLP---****X",
                  "tag": "PROBABLE LINE OF DEPLOYMENT",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.C2GM.OFF.LNE.LD": {
                  "symbolID": "G*GPOLT---****X",
                  "tag": "LINE OF DEPARTURE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.C2GM.OFF.LNE.LMTADV": {
                  "symbolID": "G*GPOLL---****X",
                  "tag": "LIMIT OF ADVANCE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.C2GM.OFF.LNE.LDLC": {
                  "symbolID": "G*GPOLC---****X",
                  "tag": "LINE OF DEPARTURE/LINE OF CONTACT",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.C2GM.GNL.LNE.LOC": {
                  "symbolID": "G*GPGLC---****X",
                  "tag": "LINE OF CONTACT",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.C2GM.GNL.LNE.FLOT": {
                  "symbolID": "G*GPGLF---****X",
                  "tag": "FORWARD LINE OF OWN TROOPS",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.C2GM.DEF.LNE.FEBA": {
                  "symbolID": "G*GPDLF---****X",
                  "tag": "FORWARD EDGE OF BATTLE AREA",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.C2GM.OFF.LNE.FCL": {
                  "symbolID": "G*GPOLF---****X",
                  "tag": "FINAL COORDINATION LINE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.LNE.C2LNE": {
                  "symbolID": "G*FPLCF---****X",
                  "tag": "FIRE SUPPORT COORDINATION LINE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.LNE.C2LNE.CFL": {
                  "symbolID": "G*FPLCC---****X",
                  "tag": "COORDINATED FIRE LINE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.LNE.C2LNE.NFL": {
                  "symbolID": "G*FPLCN---****X",
                  "tag": "NO-FIRE LINE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.FSUPP.LNE.C2LNE.RFL": {
                  "symbolID": "G*FPLCR---****X",
                  "tag": "RESTRICTIVE FIRE LINE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.MOBSU.SU.FTFDLN": {
                  "symbolID": "G*MPSL----****X",
                  "tag": "FORTIFIED LINE",
                  "symbolType": "MultiSegmentLine"
            }
       },

       "defenseAreas": {
            "TACGRP.C2GM.DEF.ARS.BTLPSN": {
                  "symbolID": "G*GPDAB---****X",
                  "tag": "BATTLE POSITION",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "hostile", "echelon" ]
            },
            "TACGRP.C2GM.DEF.ARS.BTLPSN.PBNO": {
                  "symbolID": "G*GPDABP--****X",
                  "tag": "BATTLE POSITION PREPARED BUT NOT OCCUPIED",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "hostile", "echelon" ]
            },
            "TACGRP.C2GM.DEF.ARS.EMTARA": {
                  "symbolID": "G*GPDAE---****X",
                  "tag": "ENGAGEMENT AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            }
       },

       "wire-fence": {
            "TACGRP.MOBSU.OBST.WREOBS.USP": {
                  "symbolID": "G*MPOWU---****X",
                  "tag": "WIRE OBSTACLE UNSPECIFIED",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.SNGFN": {
                  "symbolID": "G*MPOWS---****X",
                  "tag": "SINGLE FENCE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.DBLFN": {
                  "symbolID": "G*MPOWD---****X",
                  "tag": "DOUBLE FENCE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.DAFNC": {
                  "symbolID": "G*MPOWA---****X",
                  "tag": "DOUBLE APRON FENCE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.LWFN": {
                  "symbolID": "G*MPOWL---****X",
                  "tag": "LOW WIRE FENCE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.HWFN": {
                  "symbolID": "G*MPOWH---****X",
                  "tag": "HIGH WIRE FENCE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.CCTA.S": {
                  "symbolID": "G*MPOWCS--****X",
                  "tag": "SINGLE CONCERTINA",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.CCTA.DBLSTD": {
                  "symbolID": "G*MPOWCD--****X",
                  "tag": "DOUBLE STRAND CONCERTINA",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.WREOBS.CCTA.TRISTD": {
                  "symbolID": "G*MPOWCT--****X",
                  "tag": "TRIPLE STRAND CONCERTINA",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.AVN.OHWIRE": {
                  "symbolID": "G*MPOHO---****X",
                  "tag": "OVERHEAD WIRE",
                  "symbolType": "MultiSegmentLine"
            }
       },

       "obstacles": {
            "TACGRP.MOBSU.OBST.GNL.LNE": {
                  "symbolID": "G*MPOGL---****X",
                  "tag": "LINEAR OBSTACLE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.ABS": {
                  "symbolID": "G*MPOS----****X",
                  "tag": "ABATIS",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.ATO.ATD.ATDUC": {
                  "symbolID": "G*MPOADU--****X",
                  "tag": "ANTITANK DITCH UNDER CONSTRUCTION",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.ATO.ATD.ATDC": {
                  "symbolID": "G*MPOADC--****X",
                  "tag": "ANTITANK DITCH COMPLETE",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.ATO.ATD.ATDATM": {
                  "symbolID": "G*MPOAR---****X",
                  "tag": "ANTITANK DITCH REINFORCED WITH MINES",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.ATO.ATD.ATW": {
                  "symbolID": "G*MPOAW---****X",
                  "tag": "ANTITANK WALL",
                  "symbolType": "MultiSegmentLine"
            },
            "TACGRP.MOBSU.OBST.GNL.BLT": {
                  "symbolID": "G*MPOGB---****X",
                  "tag": "OBSTACLE GENERAL BELT",
                  "symbolType": "MultiSegmentPolygon",
                   "validModifiers": [ "uniqueDesignation1", "uniqueDesignation2" ]
           },
            "TACGRP.MOBSU.OBST.GNL.Z": {
                  "symbolID": "G*MPOGZ---****X",
                  "tag": "OBSTACLE GENERAL ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.MOBSU.OBST.GNL.OFA": {
                  "symbolID": "G*MPOGF---****X",
                  "tag": "OBSTACLE FREE AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.MOBSU.OBST.GNL.ORA": {
                  "symbolID": "G*MPOGR---****X",
                  "tag": "OBSTACLE RESTRICTED AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.MOBSU.OBST.MNEFLD.MNDARA": {
                  "symbolID": "G*MPOFA---****X",
                  "tag": "MINED AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "hostile" ]
            },
            "TACGRP.C2GM.DCPN.DMA": {
                  "symbolID": "G*GPPM----****X",
                  "tag": "DECOY MINED AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "hostile" ]
            },
            "TACGRP.C2GM.DCPN.DMAF": {
                  "symbolID": "G*GPPY----****X",
                  "tag": "DECOY MINED AREA FENCED",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "hostile" ]
            },
            "TACGRP.C2GM.DCPN.DMYMD": {
                  "symbolID": "G*GPPC----****X",
                  "tag": "DUMMY MINEFIELD",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "hostile", "additionalInfo1" ]
            },
            "TACGRP.MOBSU.OBST.UXO": {
                  "symbolID": "G*MPOU----****X",
                  "tag": "UNEXPLODED ORDNANCE AREA",
                  "symbolType": "MultiSegmentPolygon"
            },
            "TACGRP.MOBSU.SU.STRGPT": {
                  "symbolID": "G*MPSP----****X",
                  "tag": "STRONG POINT",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "echelon" ]
            }
       },

       "supply": {
            "TACGRP.CSS.LNE.SPLRUT.MSRUT": {
                  "symbolID": "G*SPLRM---****X",
                  "tag": "MAIN SUPPLY ROUTE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.LNE.SPLRUT.ASRUT": {
                  "symbolID": "G*SPLRA---****X",
                  "tag": "ALTERNATE SUPPLY ROUTE",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.LNE.SPLRUT.1WYTRFF": {
                  "symbolID": "G*SPLRO---****X",
                  "tag": "SUPPLY ROUTE 1 WAY TRAFFIC",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.LNE.SPLRUT.ATRFF": {
                  "symbolID": "G*SPLRT---****X",
                  "tag": "SUPPLY ROUTE ALTERNATING TRAFFIC",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.LNE.SPLRUT.2WYTRFF": {
                  "symbolID": "G*SPLRW---****X",
                  "tag": "SUPPLY ROUTE 2 WAY TRAFFIC",
                  "symbolType": "MultiSegmentLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            }
       },

       "fireSupport": {
            "TACGRP.FSUPP.LNE.LNRTGT": {
                  "symbolID": "GHFPLT----****X",
                  "tag": "LINEAR TARGET",
                  "symbolType": "SimpleLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.LNE.LNRTGT.LSTGT": {
                  "symbolID": "G*FPLTS---****X",
                  "tag": "LINEAR SMOKE TARGET",
                  "symbolType": "SimpleLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.LNE.LNRTGT.FPF": {
                  "symbolID": "G*FPLTF---****X",
                  "tag": "LINEAR TARGET FINAL PROTECTIVE FIRE",
                  "symbolType": "SimpleLine",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.ARS.ARATGT.RTGTGT": {
                  "symbolID": "G*FPATR---****X",
                  "tag": "RECTANGULAR TARGET",
                  "symbolType": "RectangleSinglePoint",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.ARS.ARATGT": {
                  "symbolID": "G*FPAT----****X",
                  "tag": "AREA TARGET IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.ARS.ARATGT.SGTGT": {
                  "symbolID": "G*FPATG---****X",
                  "tag": "TARGET SERIES OR GROUP",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.FSUPP.ARS.ARATGT.SMK": {
                  "symbolID": "G*FPATS---****X",
                  "tag": "AREA TARGET SMOKE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.ARATGT.BMARA": {
                  "symbolID": "G*FPATB---****X",
                  "tag": "BOMB AREA",
                  "symbolType": "MultiSegmentPolygon"
            },
            "TACGRP.FSUPP.ARS.C2ARS.PAA.RTG": {
                  "symbolID": "G*FPACPR--****X",
                  "tag": "POSITION AREA FOR ARTILLERY RECTANGULAR",
                  "symbolType": "RectangleMultiPoint"
            },
            "TACGRP.FSUPP.ARS.C2ARS.FSA.RTG": {
                  "symbolID": "G*FPACSI--****X",
                  "tag": "FIRE SUPPORT AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.FSA.IRR": {
                  "symbolID": "G*FPACSI--****X",
                  "tag": "FIRE SUPPORT AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.ACA.RTG": {
                  "symbolID": "G*FPACAI--****X",
                  "tag": "AIRSPACE COORDINATION AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "additionalInfo3", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.ACA.IRR": {
                  "symbolID": "G*FPACAI--****X",
                  "tag": "AIRSPACE COORDINATION AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "additionalInfo3", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.FFA.RTG": {
                  "symbolID": "G*FPACFI--****X",
                  "tag": "FREE FIRE AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.FFA.IRR": {
                  "symbolID": "G*FPACFI--****X",
                  "tag": "FREE FIRE AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.NFA.RTG": {
                  "symbolID": "G*FPACNI--****X",
                  "tag": "NO-FIRE AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.NFA.IRR": {
                  "symbolID": "G*FPACNI--****X",
                  "tag": "NO-FIRE AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.RFA.RTG": {
                  "symbolID": "G*FPACRI--****X",
                  "tag": "RESTRICTIVE AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.RFA.IRR": {
                  "symbolID": "G*FPACRI--****X",
                  "tag": "RESTRICTIVE AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.SNSZ.RTG": {
                  "symbolID": "G*FPACEI--****X",
                  "tag": "SENSOR ZONE RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.SNSZ.IRR": {
                  "symbolID": "G*FPACEI--****X",
                  "tag": "SENSOR ZONE IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.SNSZ.RTG": {
                  "symbolID": "G*FPACDI--****X",
                  "tag": "DEAD SPACE AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.SNSZ.IRR": {
                  "symbolID": "G*FPACDI--****X",
                  "tag": "DEAD SPACE AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.ZOR.RTG": {
                  "symbolID": "G*FPACZI--****X",
                  "tag": "ZONE OF RESPONSIBILITY RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.ZOR.IRR": {
                  "symbolID": "G*FPACZI--****X",
                  "tag": "ZONE OF RESPONSIBILITY IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.TBA.RTG": {
                  "symbolID": "G*FPACBI--****X",
                  "tag": "TARGET BUILD-UP AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.TBA.IRR": {
                  "symbolID": "G*FPACBI--****X",
                  "tag": "TARGET BUILD-UP AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.TVAR.RTG": {
                  "symbolID": "G*FPACVI--****X",
                  "tag": "TARGET VALUE AREA RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.TVAR.IRR": {
                  "symbolID": "G*FPACVI--****X",
                  "tag": "TARGET VALUE AREA IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.ATIZ.RTG": {
                  "symbolID": "G*FPAZII--****X",
                  "tag": "ARTILLERY TARGET INTELLIGENCE ZONE RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.ATIZ.IRR": {
                  "symbolID": "G*FPAZII--****X",
                  "tag": "ARTILLERY TARGET INTELLIGENCE ZONE IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.CFFZ.RTG": {
                  "symbolID": "G*FPAZXI--****X",
                  "tag": "CALL FOR FIRE ZONE RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.CFFZ.IRR": {
                  "symbolID": "G*FPAZXI--****X",
                  "tag": "CALL FOR FIRE ZONE IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.CNS.RTG": {
                  "symbolID": "G*FPAZCI--****X",
                  "tag": "CENSOR ZONE RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.CNS.IRR": {
                  "symbolID": "G*FPAZCI--****X",
                  "tag": "CENSOR ZONE IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.CFZ.RTG": {
                  "symbolID": "G*FPAZFI--****X",
                  "tag": "CRITICAL FRIENDLY ZONE RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.TGTAQZ.CFZ.IRR": {
                  "symbolID": "G*FPAZFI--****X",
                  "tag": "CRITICAL FRIENDLY ZONE IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.KLBOX.BLUE.RTG": {
                  "symbolID": "G*FPAKBI--****X",
                  "tag": "KILL BOX BLUE RECTANGULAR",
                  "symbolType": "RectangleMultiPoint",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.KLBOX.BLUE.IRR": {
                  "symbolID": "G*FPAKBI--****X",
                  "tag": "KILL BOX BLUE IRREGULAR",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            },
            "TACGRP.FSUPP.ARS.C2ARS.TGMF": {
                  "symbolID": "G*FPACT---****X",
                  "tag": "TERMINALLY GUIDED MUNITION FOOTPRINT",
                  "symbolType": "MultiSegmentPolygon"
            }
       },

       "combatServiceSupport": {
            "TACGRP.CSS.ARA.DHA": {
                  "symbolID": "G*SPAD----****X",
                  "tag": "DETAINEE HOLDING AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.ARA.EPWHA": {
                  "symbolID": "G*SPAE----****X",
                  "tag": "ENEMY PRISONERS OF WAR HOLDING AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.ARA.FARP": {
                  "symbolID": "G*SPAR----****X",
                  "tag": "FORWARD ARMING AND REFUELING AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.ARA.RHA": {
                  "symbolID": "G*SPAH----****X",
                  "tag": "REFUGEE HOLDING AREA",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.ARA.BSA": {
                  "symbolID": "G*SPASB---****X",
                  "tag": "SUPPORT AREA BRIGADE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.ARA.DSA": {
                  "symbolID": "G*SPASD---****X",
                  "tag": "SUPPORT AREA DIVISION",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            },
            "TACGRP.CSS.ARA.RSA": {
                  "symbolID": "G*SPASR---****X",
                  "tag": "SUPPORT AREA REGIMENTAL",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1" ]
            }
       },

       "airOperations": {
            "TACGRP.C2GM.AVN.ARS.ROZ": {
                  "symbolID": "G*GPAAR---****X",
                  "tag": "RESTRICTED OPERATIONS ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "DTG1", "DTG2" ]
            },
            "TACGRP.C2GM.AVN.ARS.SHRDEZ": {
                  "symbolID": "G*GPAAF---****X",
                  "tag": "SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "DTG1", "DTG2" ]
            },
            "TACGRP.C2GM.AVN.ARS.HIDACZ": {
                  "symbolID": "G*GPAAH---****X",
                  "tag": "HIGH DENSITY AIRSPACE CONTROL ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "DTG1", "DTG2" ]
            },
            "TACGRP.C2GM.AVN.ARS.MEZ": {
                  "symbolID": "G*GPAAM---****X",
                  "tag": "MISSILE ENGAGEMENT ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "DTG1", "DTG2" ]
            },
            "TACGRP.C2GM.AVN.ARS.MEZ.LAMEZ": {
                  "symbolID": "G*GPAAML--****X",
                  "tag": "MISSILE ENGAGEMENT ZONE LOW ALTITUDE ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "DTG1", "DTG2" ]
            },
            "TACGRP.C2GM.AVN.ARS.MEZ.HAMEZ": {
                  "symbolID": "G*GPAAMH--****X",
                  "tag": "MISSILE ENGAGEMENT ZONE HIGH ALTITUDE ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "additionalInfo1", "additionalInfo2", "DTG1", "DTG2" ]
            },
            "TACGRP.C2GM.AVN.ARS.WFZ": {
                  "symbolID": "G*GPAAW---****X",
                  "tag": "WEAPONS FREE ZONE",
                  "symbolType": "MultiSegmentPolygon",
                  "validModifiers": [ "uniqueDesignation1", "DTG1", "DTG2" ]
            }
       },

       "aliasModifiers": { 
            "echelon":             { modifier:  "B_ECHELON",
                                     type:      "ModifiersUnits",
                                     valueType: "Text" },
            "quantity":            { modifier:  "C_QUANTITY",
                                     type:      "ModifiersUnits",
                                     valueType: "Number" },
            "additionalInfo1":     { modifier:  "H_ADDITIONAL_INFO_1",
                                     type:      "ModifiersUnits",
                                     valueType: "Text" },
            "additionalInfo2":      { modifier:  "H1_ADDITIONAL_INFO_2",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "additionalInfo3":      { modifier:  "H2_ADDITIONAL_INFO_3",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "altitudeDepth":        { modifier:  "X_ALTITUDE_DEPTH",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "combatEffectiveness":  { modifier:  "K_COMBAT_EFFECTIVENESS",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "directionOfMovement":  { modifier:  "Q_DIRECTION_OF_MOVEMENT",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "evaluationRating":     { modifier:  "J_EVALUATION_RATING",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "higherFormation":      { modifier:  "M_HIGHER_FORMATION",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "hostile":              { modifier:  "N_HOSTILE",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "iffSif":               { modifier:  "P_IFF_SIF",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "location":             { modifier:  "Y_LOCATION",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "reinforcedReduced":    { modifier:  "F_REINFORCED_REDUCED",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "signatureEquip":       { modifier:  "L_SIGNATURE_EQUIP",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "staffComments":        { modifier:  "G_STAFF_COMMENTS",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "equipType":            { modifier:  "V_EQUIP_TYPE",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "uniqueDesignation1":   { modifier:  "T_UNIQUE_DESIGNATION_1",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "uniqueDesignation2":   { modifier:  "T1_UNIQUE_DESIGNATION_2",
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "speed":                { modifier:  "Z_SPEED",                            
                                      type:      "ModifiersUnits",
                                      valueType: "Text" },
            "pixelSize":            { modifier:  "PixelSize",                            
                                      type:      "MilStdAttributes",
                                      valueType: "Number" },
            "fillColor":            { modifier:  "FillColor",                            
                                      type:      "MilStdAttributes",
                                      valueType: "Text" },
            "lineColor":            { modifier:  "LineColor",                            
                                      type:      "MilStdAttributes",
                                      valueType: "Text" },
            "lineWidth":            { modifier:  "LineWidth",                            
                                      type:      "MilStdAttributes",
                                      valueType: "Number" },
            "icon":                 { modifier:  "Icon",                            
                                      type:      "MilStdAttributes",
                                      valueType: "Boolean" },
            "keepUnitRatio":        { modifier:  "KeepUnitRatio",                            
                                      type:      "MilStdAttributes",
                                      valueType: "Boolean" },
            "symbologyStandard":    { modifier:  "SymbologyStandard",                            
                                      type:      "MilStdAttributes",
                                      valueType: "Number" },
            "distance":             { modifier:  "AM_DISTANCE",                            
                                      type:      "ModifiersTG",
                                      valueType: "Array" },
            "azimuth":              { modifier:  "AN_AZIMUTH",                            
                                      type:      "ModifiersTG",
                                      valueType: "Array" },
            "length":               { modifier:  "LENGTH",                            
                                      type:      "ModifiersTG",
                                      valueType: "Number" },
            "width":                { modifier:  "WIDTH",                            
                                      type:      "ModifiersTG",
                                      valueType: "Number" },
            "angle":                { modifier:  "ANGLE",                            
                                      type:      "ModifiersTG",
                                      valueType: "Number" },
            "DTG1":                 { modifier:  "W_DTG_1",                            
                                      type:      "ModifiersTG",
                                      valueType: "Text" },
            "DTG2":                 { modifier:  "W1_DTG_2",                            
                                      type:      "ModifiersTG",
                                      valueType: "Text" }
         },
        "find": function( section, tag ) {
            var units = {};
            var sec = undefined;
            if ( this[ section ] !== undefined ) {
                for ( var fullname in this[ section ] ) {
                    if ( this[ section ][ fullname ][ tag ] === tag ){
                        units[ fullname ] = this[ section ][ fullname ];    
                    }
                }
            }
            return units;
        },
        "findAll": function( section, tag ) {
            var units = {};
            var sec = undefined;
            if ( this[ section ] !== undefined ) {
                for ( var fullname in this[ section ] ) {
                    if (  fullname.indexOf( tag ) !== -1 ){
                        units[ fullname ] = this[ section ][ fullname ];    
                    }
                }
            }
            return units;
        },
        "decode": function( name ){
            var parts = name.split( '.' );
            for ( var i = 0; i < parts.length; i++ ) {
                parts[ i ] = ( this.def[ parts[ i ] ] !== undefined ) ? this.def[ parts[ i ] ] : parts[ i ];    
            }
            return parts.join( '.' );   
        },
        "description": function( name, unit ){
            var foundTag = false;
            var parts = name.split( '.' );
            var retStr = "";
            var prefix = "";
            for ( var i = 0; i < parts.length; i++ ){
                if ( foundTag ) {
                    prefix = prefix + "  ";
                } else if ( parts[ i ] === unit.tag ) {
                    foundTag = true;
                }
                if ( this.def[ parts[ i ] ] ) {
                    retStr = retStr + prefix + this.def[ parts[ i ] ] + "\n";
                } else {
                    retStr = retStr + prefix + parts[ i ] + "\n";
                }
            }

            return retStr;
        },
        "preTag": function( name, tag ) {
            var retStr = "";
            var index = name.indexOf( tag );
            if ( index !== -1 ) {
                retStr = name.substr( 0, index - 1 );
            } 
            return retStr;
        },
        "postTag": function( name, tag ) {
            var tagLen = tag.length;
            var retStr = "";
            var index = name.indexOf( tag );
            if ( index !== -1 ) {
                retStr = name.substr( index + tagLen + 1 );
            } 
            return retStr;            
        },
        "addEchelonToSymbolId": function( symbolID, value ) {
            var retStr = symbolID;
            var echelon = symbolID.charAt(10);
            // Override installation
            if ( ( echelon === 'H' ) || ( echelon === '*' ) ) {
                  echelon = '-';
            }

            switch( value ) {
                
                case "team":
                case "crew":
                    echelon += 'A';
                    break;
                case "squad":
                    echelon += 'B';
                    break;
                case "section":
                    echelon += 'C';
                    break;                
                case "platoon":
                case "detachment":
                    echelon += 'D';
                    break;
                case "company":
                case "battery":
                case "troop":
                    echelon += 'E';
                    break;                
                case "battalion":
                case "squadron":
                    echelon += 'F';
                    break;                
                case "regiment":
                case "group":
                    echelon += 'G';
                    break;  
                case "brigade":
                    echelon += 'H';
                    break;  
                case "division":
                    echelon += 'I';
                    break;  
                case "corps":
                case "mef":
                    echelon += 'J';
                    break;                  
                case "army":
                    echelon += 'K';
                    break; 
                case "armyGroup":
                case "army group":
                case "front":
                    echelon += 'L';
                    break; 
                case "region":
                    echelon += 'M';
                    break; 
                case "null":
                case "none":
                default:
                    echelon += '-';
                    break; 

            }  
            retStr = symbolID.substr( 0, 10 ) + echelon + symbolID.substr( 12 );
            return retStr;          
        },
        "addAffiliationToSymbolId": function( symbolID, value ) {
            var retStr = symbolID;
            switch ( value ) {
                case "unknown":
                    retStr = this.unknown( symbolID );
                    break;
                case "friendly":
                    retStr = this.friendly( symbolID );
                    break;
                case "neutral":
                    retStr = this.neutral( symbolID );
                    break;
                case "hostile":
                    retStr = this.hostile( symbolID );
                    break;
            }
            return retStr;
        },    
        "unknown": function( symbolID ) {
            return symbolID.substr( 0, 1 ) + "U" + symbolID.substr( 2 );
        },
        "friendly": function( symbolID ) {
            return symbolID.substr( 0, 1 ) + "F" + symbolID.substr( 2 );
        },
        "neutral": function( symbolID ) {
            return symbolID.substr( 0, 1 ) + "N" + symbolID.substr( 2 );
        },
        "hostile": function( symbolID ) {
            return symbolID.substr( 0, 1 ) + "H" + symbolID.substr( 2 );
        },  
        "addUnitStatusToSymbolId": function( symbolID, value ) {
            var retStr = symbolID;
            if ( symbolID.charAt(0) === 'S' ) {
                  var unitStatus = symbolID.charAt(3);
                  switch ( value ) {
                      case "anticipated":
                          unitStatus = "A";
                          break;
                      case "present":
                          unitStatus = "P";
                          break;
                      case "capable":
                          unitStatus = "C";
                          break;
                      case "damaged":
                          unitStatus = "D";
                          break;
                      case "destroyed":
                          unitStatus = "X";
                          break;
                      case "full":
                          unitStatus = "F";
                          break;
                  }
                  retStr = symbolID.substr( 0, 3 ) + unitStatus + symbolID.substr( 4 );
            }
            return retStr;
        },    
        "addMobilityToSymbolId": function( symbolID, value ) {
            var retStr = symbolID;
            if ( ( symbolID.charAt(0) === 'S' ) && ( symbolID.charAt(4) === 'E' ) ) {
                  var mobility = symbolID.substr( 10, 2 );
                  switch ( value ) {
                      case "none":
                          mobility = "**";
                          break;
                      case "wheeled limited cross-country":
                          mobility = "MO";
                          break;
                      case "cross-country":
                          mobility = "MP";
                          break;
                      case "tracked":
                          mobility = "MQ";
                          break;
                      case "wheeled and tracked":
                          mobility = "MR";
                          break;
                      case "towed":
                          mobility = "MS";
                          break;
                      case "rail":
                          mobility = "MT";
                          break;
                      case "over snow":
                          mobility = "MU";
                          break;
                      case "sled":
                          mobility = "MV";
                          break;
                      case "pack animals":
                          mobility = "MW";
                          break;
                      case "barge":
                          mobility = "MX";
                          break;
                      case "amphibious":
                          mobility = "MY";
                          break;
                  }
                  retStr = symbolID.substr( 0, 10 ) + mobility + symbolID.substr( 12 );
            }
            return retStr;
        },    
        "addTaskForceToSymbolId": function( symbolID, value ) {
            var retStr = symbolID;
            if ( ( symbolID.charAt(0) === 'S' ) && ( symbolID.charAt(4) === 'U' ) ) {
                  var taskForce = symbolID.charAt(10);
                  // Override installation
                  var echelon   = symbolID.charAt(11);
                  if ( symbolID.charAt(10) === "H" ) {
                        taskForce = '-';
                        echelon   = '-';
                  }

                  switch ( value ) {
                      case "none":
                          taskForce = "-";
                          break;
                      case "HQ":
                          taskForce = "A";
                          break;
                      case "TF HQ":
                          taskForce = "B";
                          break;
                      case "FD HQ":
                          taskForce = "C";
                          break;
                      case "FD-TF HQ":
                          taskForce = "D";
                          break;
                      case "TF":
                          taskForce = "E";
                          break;
                      case "FD":
                          taskForce = "F";
                          break;
                      case "FD-TF":
                          taskForce = "G";
                          break;
                  }
                  retStr = symbolID.substr( 0, 10 ) + taskForce + echelon + symbolID.substr( 12 );
            }
            return retStr;
        },    
        "addInstallationToSymbolId": function( symbolID, value ) {
            var retStr = symbolID;
            if ( symbolID.charAt(0) === 'S' ) {
                  var installation = symbolID.substr(10, 2);
                  switch ( value ) {
                      case "none":
                          installation = "--";
                          break;
                      case "installation":
                          installation = "H-";
                          break;
                      case "feint-dummy":
                          installation = "HB";
                          break;
                  }
                  retStr = symbolID.substr( 0, 10 ) + installation + symbolID.substr( 12 );
            }
            return retStr;
        },    
        "modifierByAlias": function( alias ) {
            var modifierObj = undefined;
                                
            if ( this.aliasModifiers[ alias ] ) {
                modifierObj = this.aliasModifiers[ alias ];
            }
            
            return modifierObj;
        }
    };

    return cws;
    
});


