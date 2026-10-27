from pathlib import Path
from shapely.geometry import Polygon, LineString
out=Path('docs/branding/woven-l')
def diamond(x,y,r): return Polygon([(x,y-r),(x+r,y),(x,y+r),(x-r,y)])
def path(geom):
    polys=list(geom.geoms) if geom.geom_type=='MultiPolygon' else [geom]
    parts=[]
    for poly in polys:
        for ring in [poly.exterior,*poly.interiors]:
            parts.append('M'+'L'.join(f'{x:g},{y:g}' for x,y in list(ring.coords)[:-1])+'Z')
    return ' '.join(parts)
outer=Polygon([(32,32),(112,32),(112,144),(224,144),(224,224),(32,224)])
slot=LineString([(72,16),(72,184),(240,184)]).buffer(12,cap_style=2,join_style=2)
node=diamond(72,184,40)
mark=outer.difference(slot).union(node).difference(diamond(72,184,18))
remainder=mark.difference(node)
outer_region=Polygon([(0,0),(72,0),(72,184),(256,184),(256,256),(0,256)])
coral=remainder.intersection(outer_region)
cyan=remainder.difference(outer_region)
assert abs(coral.union(cyan).union(node.difference(diamond(72,184,18))).symmetric_difference(mark).area)<.001
body=f'<path fill="#f8cf76" fill-rule="evenodd" d="{path(mark)}"/>\n<path fill="#ff7468" fill-rule="evenodd" d="{path(coral)}"/>\n<path fill="#54c9db" fill-rule="evenodd" d="{path(cyan)}"/>'
head='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-labelledby="title"><title id="title">London Transit Map - woven interchange</title>\n'
(out/'woven-l-color.svg').write_text(head+body+'\n</svg>\n',encoding='utf-8')
(out/'woven-l-favicon-master.svg').write_text(head+'<rect width="256" height="256" rx="48" fill="#181c20"/>\n'+body+'\n</svg>\n',encoding='utf-8')
