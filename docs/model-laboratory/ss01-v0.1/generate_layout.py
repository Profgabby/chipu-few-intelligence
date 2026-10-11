from pathlib import Path
import json,math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
out=Path(__file__).resolve().parent
L,W,gap,tilt=1.722,1.134,.02,20
run=6*W+5*gap; proj=L*math.cos(math.radians(tilt)); rise=L*math.sin(math.radians(tilt)); x0=(12-run)/2
rows=[]
for i,y in enumerate([3.,9.]):
 modules=[]
 for j in range(6):
  x=x0+j*(W+gap); lo=y-proj/2; hi=y+proj/2
  modules.append({'id':f'R{i+1}M{j+1}','corners_m':[[x,lo,2.4],[x+W,lo,2.4],[x+W,hi,2.4+rise],[x,hi,2.4+rise]]})
 rows.append({'id':f'R{i+1}','horizontal_centerline_y_m':y,'modules':modules})
beds=[{'id':f'B{i+1}','southwest_m':[2.,y,0.],'east_west_length_m':8.,'north_south_width_m':1.} for i,y in enumerate([.75,2.65,4.55,6.45,8.35,10.25])]
doc={'schema_version':'ss01-geometry-0.1','configuration_id':'SS01-GardenLift-RC-v0.1','status':'proposed-design-not-as-built-not-construction-approved','provenance':{'basis':'User-requested formalization of proposed configuration in conversation','dimensions':'Design choices, not measurements from concept illustration','module':'Unselected procurement target; no manufacturer specification claimed'},'coordinate_system':{'units':'m','origin':'Each plot southwest corner at ground level','x':'east','y':'north','z':'up','north':'true north','ground':'level plane z=0','control_placement':'Independent local frame; geographic offset unresolved; drawing panels do not imply adjacency'},'site':{'latitude_deg':None,'longitude_deg':None,'elevation_m':None,'timezone':None,'weather_dataset':None},'design_inputs':{'plot_east_west_m':12,'plot_north_south_m':12,'row_count':2,'modules_per_row':6,'module_slope_length_m':L,'module_east_west_width_m':W,'module_gap_along_row_m':gap,'module_rating_target_Wp':430,'surface_tilt_deg':tilt,'surface_azimuth_deg_clockwise_from_north':180,'row_pitch_m':6,'lower_module_edge_height_m':2.4,'tracking':False,'battery':False,'module_dimensions_status':'provisional-envelope-replace-with-selected-datasheet'},'derived':{'module_count':12,'dc_capacity_target_kWp':5.16,'plot_area_m2':144,'planted_area_per_plot_m2':48,'row_length_including_gaps_m':run,'module_horizontal_projection_m':proj,'module_vertical_rise_m':rise,'upper_module_edge_height_m':2.4+rise,'row_center_height_m':2.4+rise/2,'clear_horizontal_gap_between_rows_m':6-proj,'module_surface_area_total_m2':12*L*W,'module_projected_area_total_m2':12*L*W*math.cos(math.radians(tilt))},'av_plot':{'rows':rows,'beds':beds},'open_sun_plot':{'width_m':12,'length_m':12,'pv_modules':[],'beds':beds,'shade_exclusion_verified':False},'crop':{'species':'lettuce','cultivar':None,'planting_date':None,'harvest_date':None},'irrigation':{'method':'drip','control':'Same soil-moisture rule in both treatments; independent delivered-volume measurement','trigger':None,'pump_curve':None,'total_dynamic_head_m':None,'efficiency':None,'emitter_specification':None},'unresolved':['Geographic placement and all-season control shading exclusion','Module and inverter datasheets and string design','Posts, beams, foundations, loads and minimum unobstructed clearance','Soil, crop, weather and irrigation parameters','Equipment and installation costs','Replication/randomization; beds within one array are subsamples, not independent AV replicates'],'simulation_results':None,'formulas':{'row_length':'6 * module_width + 5 * gap','horizontal_projection':'module_slope_length * cos(tilt)','upper_edge':'lower_edge + module_slope_length * sin(tilt)','dc_capacity':'module_count * rating_Wp / 1000'}}
(out/'SS01-parameters.json').write_text(json.dumps(doc,indent=2)+'\n')
green='#006B3C';gold='#D99A00';char='#29352F'
fig=plt.figure(figsize=(15,11),facecolor='#FFFEF8');gs=fig.add_gridspec(2,2,height_ratios=[1,.58],hspace=.38,wspace=.25)
def dim(ax,a,b,label,offset=0):
 ax.annotate('',xy=b,xytext=a,arrowprops={'arrowstyle':'<->','color':char,'lw':.8});ax.text((a[0]+b[0])/2,(a[1]+b[1])/2+offset,label,ha='center',va='bottom',fontsize=8,color=char,bbox={'facecolor':'#FFFEF8','edgecolor':'none','pad':1})
for k in [0,1]:
 ax=fig.add_subplot(gs[0,k]);ax.set_aspect('equal');ax.add_patch(Rectangle((0,0),12,12,fill=False,ec=char,lw=1.5))
 for b in beds:
  x,y,_=b['southwest_m'];ax.add_patch(Rectangle((x,y),8,1,facecolor='#DBEBDD',edgecolor=green,lw=.8));ax.text(10.2,y+.35,b['id'],fontsize=8,color=green)
 if k==0:
  for row in rows:
   for m in row['modules']:
    x,y,_=m['corners_m'][0];ax.add_patch(Rectangle((x,y),W,proj,facecolor='#C6D9EB',edgecolor='#315B78',alpha=.7,lw=.8))
   ax.text(.3,row['horizontal_centerline_y_m'],row['id'],fontsize=9)
  dim(ax,(1,3),(1,9),'6 m pitch');dim(ax,(x0,12.5),(x0+run,12.5),'6.904 m row length')
 else: ax.text(6,12.6,'Matching bed geometry; no PV',ha='center',fontsize=9)
 dim(ax,(0,-.6),(12,-.6),'12 m');ax.annotate('N',xy=(12.6,11.5),xytext=(12.6,9.8),ha='center',arrowprops={'arrowstyle':'->','color':green},color=green)
 ax.set_xlim(-.5,13.2);ax.set_ylim(-1.2,13.5);ax.set_xlabel('x: east (m)');ax.set_ylabel('y: north (m)');ax.set_xticks([0,2,4,6,8,10,12]);ax.set_yticks([0,2,4,6,8,10,12]);ax.grid(alpha=.12)
 ax.set_title(('A  |  SS01 plan: module projections over beds' if k==0 else 'B  |  Open-sun control: separate local plot'),loc='left',fontsize=11,color=green,pad=14)
ax=fig.add_subplot(gs[1,:]);ax.set_aspect('equal');ax.plot([0,12],[0,0],color=green,lw=2)
for row in rows:
 y=row['horizontal_centerline_y_m'];lo=y-proj/2;hi=y+proj/2
 ax.plot([lo,hi],[2.4,2.4+rise],color='#315B78',lw=5)
 ax.plot([lo,lo],[0,2.4],ls=':',color=char,lw=.7);ax.plot([hi,hi],[0,2.4+rise],ls=':',color=char,lw=.7)
 ax.text(y,3.18,row['id']+' • 20°',ha='center',fontsize=9)
 dim(ax,(lo,-.4),(hi,-.4),f'{proj:.3f} m')
dim(ax,(.8,0),(.8,2.4),'2.400 m');dim(ax,(11.4,0),(11.4,2.4+rise),f'{2.4+rise:.3f} m');dim(ax,(3,3.65),(9,3.65),'6.000 m pitch')
ax.set_xlim(0,12);ax.set_ylim(-.7,4);ax.set_xlabel('y: south → north (m)');ax.set_ylabel('z: height (m)');ax.set_title('C  |  Side elevation looking west — dotted lines are dimensions, not support designs',loc='left',fontsize=11,color=green)
fig.suptitle('LIFEWS  |  SS01 GardenLift — proposed geometry v0.1',x=.06,ha='left',fontsize=19,color=green,y=.98)
fig.text(.06,.937,'12 modules × 430 Wp target = 5.16 kWp DC  •  144 m² per plot  •  48 m² planted per plot',fontsize=11,color=char)
fig.text(.06,.028,'DESIGN STUDY ONLY • Not for construction. Module dimensions are provisional. No generation, yield or savings predicted.\nBeds: 8 × 1 m, x = 2–10 m; south edges y = 0.75, 2.65, 4.55, 6.45, 8.35, 10.25 m. Control separation remains unresolved.',fontsize=9,color=char)
fig.subplots_adjust(top=.87,bottom=.12)
fig.savefig(out/'SS01-dimensioned-layout.svg');fig.savefig(out/'SS01-dimensioned-layout.png',dpi=150)
# Verify numerical geometry and correspondence.
assert len(rows)==2 and sum(len(r['modules']) for r in rows)==12
assert abs(run-6.904)<1e-10
for r in rows:
 for m in r['modules']:
  assert all(0<=x<=12 and 0<=y<=12 and z>=0 for x,y,z in m['corners_m'])
assert sum(b['east_west_length_m']*b['north_south_width_m'] for b in beds)==48
print('Validated 12 module polygons, plot containment, 48 m² beds per treatment, 6.904 m rows. Upper edge:',2.4+rise)
