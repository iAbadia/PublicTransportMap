from pathlib import Path
from shapely.geometry import Polygon, LineString
from shapely.affinity import translate

out = Path('docs/branding/woven-l')
def diamond(x,y,r):
    return Polygon([(x,y-r),(x+r,y),(x,y+r),(x-r,y)])
def svg(name, geom):
    polys = list(geom.geoms) if geom.geom_type == 'MultiPolygon' else [geom]
    parts = []
    for p in polys:
        for ring in [p.exterior,*p.interiors]:
            xy=list(ring.coords)
            parts.append('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in xy[:-1])+'Z')
    text = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title"><title id="title">'+name+'</title><path fill="#000000" fill-rule="evenodd" d="'+' '.join(parts)+'"/></svg>\n'
    (out/(name+'.svg')).write_text(text,encoding='utf-8')

outer=Polygon([(32,32),(112,32),(112,144),(224,144),(224,224),(32,224)])
slot=LineString([(72,16),(72,184),(240,184)]).buffer(12,cap_style=2,join_style=2)
a=outer.difference(slot).union(diamond(72,184,40)).difference(diamond(72,184,18))
svg('a-woven-interchange-v2',a)
outer_b=Polygon([(32,32),(112,32),(112,144),(224,144),(224,224),(64,224),(32,192)])
slot_b=LineString([(72,16),(72,136),(120,184),(240,184)]).buffer(12,cap_style=2,join_style=2)
b=outer_b.difference(slot_b).union(diamond(92,156,32)).difference(diamond(92,156,18))
svg('b-diagonal-weave-v2',b)
route=LineString([(72,32),(72,160),(104,192),(224,192)])
outer_c=route.buffer(40,cap_style=2,join_style=1,quad_segs=6)
slot_c=route.buffer(12,cap_style=2,join_style=1,quad_segs=6)
c=outer_c.difference(slot_c).union(diamond(88,176,36)).difference(diamond(88,176,18))
svg('c-rounded-weave-v2',translate(c, yoff=-4))

