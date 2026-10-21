# Traces public/maps/fiore_data.png from the Grok-generated Fiore map.
# usage: python3 tools/trace_fiore.py path/to/fiore.jpg   (needs pillow, numpy, scipy)
import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from scipy import ndimage as nd
DW,DH=1024,687
im=Image.open(sys.argv[1] if len(sys.argv) > 1 else 'fiore.jpg').convert('RGB').resize((DW,DH),Image.LANCZOS)
a=np.asarray(im.filter(ImageFilter.GaussianBlur(1.5))).astype(float)
r,g,b=a[...,0],a[...,1],a[...,2]
lum=(r+g+b)/3
water=(b>r+8)&(b>g-12)
water=nd.binary_opening(water,iterations=1)
hull=[(359,70),(334,108),(315,146),(270,180),(239,210),(207,235),(180,255),(150,262),(110,270),(95,290),(100,520),(130,565),(220,605),(380,665),(470,685),(560,655),(640,605),(780,565),(830,510),(845,440),(850,370),(865,345),(900,335),(1010,300),(1010,8),(640,8),(420,8),(385,40)]
hm=Image.new('L',(DW,DH),0); ImageDraw.Draw(hm).polygon(hull,fill=1); hull=np.asarray(hm).astype(bool)
foreign_poly=[(652,0),(722,95),(780,140),(792,210),(837,280),(906,305),(982,267),(989,210),(944,143),(1024,130),(1024,0)]
fm=Image.new('L',(DW,DH),0); ImageDraw.Draw(fm).polygon(foreign_poly,fill=1); foreign=np.asarray(fm).astype(bool)
cand=hull&~water
lab,n=nd.label(cand)
seeds=[(516,337),(290,480),(474,560),(697,425),(560,60)]
keep=set(lab[y,x] for x,y in seeds)-{0}
land=np.isin(lab,list(keep))
land=nd.binary_closing(land,iterations=2)&hull
# lakes = water enclosed by land (not connected to outer sea)
sea=~land
sl,_=nd.label(sea); outer=sl[0,0]
outer_ids=set(np.unique(np.concatenate([sl[0],sl[-1],sl[:,0],sl[:,-1]])))
lake=sea&~np.isin(sl,list(outer_ids))
# also Lake Scilliora & Lamia lake are connected? force by circles
yy,xx=np.mgrid[0:DH,0:DW]
mx=np.max(a,2); mn=np.min(a,2); sat=(mx-mn)/(mx+1)
snow=(mx>180)&(sat<0.2)&land
green=(g>r-4)&(g>b+12)&land
forest=green&(lum<95)
mount=land&~green&(sat<0.5)

def segd(px,py,pts):
    d=np.full(px.shape,1e9)
    for (x0,y0),(x1,y1) in zip(pts,pts[1:]):
        vx,vy=x1-x0,y1-y0; t=np.clip(((px-x0)*vx+(py-y0)*vy)/(vx*vx+vy*vy),0,1)
        d=np.minimum(d,np.hypot(px-x0-t*vx,py-y0-t*vy))
    return d
R=[([(555,120),(548,190),(535,260),(528,300)],48,40),
   ([(470,325),(472,395),(458,455),(468,490)],30,26),
   ([(555,372),(566,430),(560,468)],18,18),
   ([(200,295),(235,380)],20,14),([(330,140),(298,195)],15,10),([(395,275),(420,300)],14,12),
   ([(640,150),(700,130),(740,110)],20,22),([(820,370),(860,340)],14,10)]
B=[(470,40,65,42),(560,55,80,58),(640,60,60,46),(520,100,55,40),(600,115,50,36),(410,40,40,26),
   (290,470,62,30),(260,500,35,18),(330,520,30,16),(474,560,42,10),(455,600,25,8)]
mh=np.zeros((DH,DW))
xs=xx.astype(float); ys=yy.astype(float)
for pts,w,ht in R:
    d=segd(xs,ys,pts); mh=np.maximum(mh,ht*np.clip(1-d/w,0,1)**1.6)
for cx,cy,rr,ht in B:
    d=np.hypot(xs-cx,ys-cy); mh=np.maximum(mh,ht*np.clip(1-d/rr,0,1)**1.3)
lumhp=np.clip((lum-nd.gaussian_filter(lum,2.5))/25,-1,1)
dist=nd.distance_transform_edt(land)
h=np.where(land,0.6+np.minimum(dist,25)*0.12,-6.0)
h+=np.where(land,mh*(1+lumhp*0.12),0)
h=np.where(lake,-4,h)
h=np.where(foreign&land,np.maximum(h,34+lumhp*6),h)
GW,GH=512,344
def d2(m): return np.pad(m.astype(float),((0,1),(0,0)),mode='edge').reshape(GH,2,GW,2).mean((1,3))
H2=d2(h)
L2,F2,S2,LK2,FR2=[d2(x) for x in (land,forest,snow,lake,foreign)]
B=np.zeros((GH,GW),np.uint8)
B[:]=1
B[F2>0.45]=2
B[(H2>12)]=3
gy=np.arange(GH)[:,None]
B[(((S2>0.25)&(H2>16))|(H2>28))&(gy<85)]=4
B[H2>38]=4
B[L2<0.5]=0
B[LK2>0.5]=5
B[(FR2>0.5)&(L2>0.5)]=7
Rr=np.clip((H2+8)*4,0,255).astype(np.uint8)
FD=np.clip(nd.gaussian_filter(F2,1.5)*255,0,255).astype(np.uint8)
Image.fromarray(np.dstack([Rr,B,FD]),'RGB').save('public/maps/fiore_data.png')
pal=np.array([(40,90,170),(120,180,80),(50,120,50),(140,120,100),(250,250,255),(70,140,220),(220,200,140),(120,60,120)],np.uint8)
prev=pal[B]; prev=(prev*(0.55+0.45*np.clip(H2/40,0,1))[...,None]).astype(np.uint8)
Image.fromarray(prev).resize((1024,688),Image.NEAREST).save('prev3.png')
print('maxh',H2.max())
