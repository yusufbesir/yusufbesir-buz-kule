# description: Blender ile stilize (toon + dış çizgi) özgün karakter ve platform sprite'ları. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
# Tek komut: blender.exe -b -P arac/blender_sprite_v2.py -- <çıktı_klasörü>
import bpy, math, sys, os
from mathutils import Vector

cikti = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(os.getcwd(), 'varlik')
os.makedirs(cikti, exist_ok=True)

def temizle():
    global CIZGI
    bpy.ops.wm.read_factory_settings(use_empty=True)
    CIZGI = None  # sahne sıfırlanınca eski malzeme geçersiz olur

def toon(ad, renk, golge=0.55):
    """İki tonlu (toon) malzeme: Diffuse -> ShaderToRGB -> sabit ColorRamp -> Emission. Olmazsa düz malzemeye düşer."""
    m = bpy.data.materials.new(ad); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    cikis = nt.nodes.new('ShaderNodeOutputMaterial')
    try:
        d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value = (1, 1, 1, 1)
        s2r = nt.nodes.new('ShaderNodeShaderToRGB')
        cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'
        koyu = tuple(c * golge for c in renk)
        cr.color_ramp.elements[0].position = 0.0; cr.color_ramp.elements[0].color = (*koyu, 1)
        e1 = cr.color_ramp.elements.new(0.35); e1.color = (*renk, 1)
        e2 = cr.color_ramp.elements.new(0.85); e2.color = (*[min(1, c * 1.25 + 0.05) for c in renk], 1)
        bw = nt.nodes.new('ShaderNodeRGBToBW')
        em = nt.nodes.new('ShaderNodeEmission')
        nt.links.new(d.outputs['BSDF'], s2r.inputs['Shader']); nt.links.new(s2r.outputs['Color'], bw.inputs['Color'])
        nt.links.new(bw.outputs['Val'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], em.inputs['Color'])
        nt.links.new(em.outputs['Emission'], cikis.inputs['Surface'])
    except Exception:
        nt.nodes.clear(); cikis = nt.nodes.new('ShaderNodeOutputMaterial')
        b = nt.nodes.new('ShaderNodeBsdfPrincipled'); b.inputs['Base Color'].default_value = (*renk, 1)
        nt.links.new(b.outputs['BSDF'], cikis.inputs['Surface'])
    return m

def cizgi_malzeme():
    m = bpy.data.materials.new('cizgi'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.04, 0.05, 0.12, 1)
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
    m.use_backface_culling = True
    return m

CIZGI = None
def cizgi_ekle(o, kalin=0.035):
    """Ters yüzey (inverted hull) ile koyu dış çizgi."""
    global CIZGI
    if CIZGI is None: CIZGI = cizgi_malzeme()
    sol = o.modifiers.new('cizgi', 'SOLIDIFY'); sol.thickness = -kalin; sol.use_flip_normals = True; sol.offset = 1
    sol.material_offset = len(o.data.materials)
    o.data.materials.append(CIZGI)

def sekil(tur, ad, konum, boyut, mat, bevel=0.05, cizgi=True):
    if tur == 'kutu': bpy.ops.mesh.primitive_cube_add(location=konum)
    elif tur == 'kure': bpy.ops.mesh.primitive_uv_sphere_add(location=konum, segments=24, ring_count=14)
    else: bpy.ops.mesh.primitive_cylinder_add(location=konum, vertices=20)
    o = bpy.context.object; o.name = ad; o.scale = boyut; o.data.materials.append(mat)
    bpy.ops.object.transform_apply(scale=True)
    if tur == 'kure' or tur == 'silindir': bpy.ops.object.shade_smooth()
    if tur == 'kutu':
        b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = 3
    if cizgi: cizgi_ekle(o)
    return o

def sahne(g, y, olcek):
    s = bpy.context.scene
    try: s.render.engine = 'BLENDER_EEVEE_NEXT'
    except TypeError: s.render.engine = 'BLENDER_EEVEE'
    s.render.film_transparent = True; s.render.resolution_x, s.render.resolution_y = g, y
    s.render.image_settings.file_format = 'PNG'; s.render.image_settings.color_mode = 'RGBA'
    s.view_settings.view_transform = 'Standard'; s.view_settings.look = 'None'
    try: s.eevee.taa_render_samples = 32
    except Exception: pass
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = olcek
    co = bpy.data.objects.new('c', cam); bpy.context.collection.objects.link(co)
    co.location = (0, -8, 0); co.rotation_euler = (math.radians(90), 0, 0); s.camera = co
    l = bpy.data.lights.new('g', 'SUN'); l.energy = 3
    lo = bpy.data.objects.new('g', l); bpy.context.collection.objects.link(lo); lo.rotation_euler = (math.radians(55), 0, math.radians(-35))

def render(ad):
    bpy.context.scene.render.filepath = os.path.join(cikti, ad + '.png'); bpy.ops.render.render(write_still=True)

def dondur(o, derece_x=0, derece_y=0, derece_z=0):
    o.rotation_euler = (math.radians(derece_x), math.radians(derece_y), math.radians(derece_z)); return o

# --- Karakter: büyük kafalı, parkalı, atkılı "kar kâşifi" ---
RENK = dict(parka=(0.95, 0.35, 0.18), parka2=(0.98, 0.78, 0.2), ten=(1.0, 0.78, 0.62), bere=(0.1, 0.55, 0.95),
            pon=(0.97, 0.98, 1.0), pantolon=(0.18, 0.22, 0.45), bot=(0.35, 0.2, 0.12), atki=(0.12, 0.8, 0.6), goz=(0.04, 0.05, 0.1))

def karakter(poz):
    temizle(); sahne(192, 256, 3.3)
    M = {k: toon(k, v) for k, v in RENK.items()}
    egim = {'dur': 0, 'kos': 10, 'zipla': -6}[poz]
    # gövde (parka) + fermuar şeridi
    sekil('kutu', 'govde', (0, 0, -0.15), (0.5, 0.36, 0.5), M['parka'], 0.12)
    sekil('kutu', 'serit', (0, -0.37, -0.15), (0.07, 0.02, 0.5), M['parka2'], 0.01, cizgi=False)
    sekil('silindir', 'atki', (0, 0, 0.42), (0.42, 0.36, 0.1), M['atki'])
    # kafa, yüz, bere
    sekil('kure', 'kafa', (0, 0, 1.0), (0.58, 0.52, 0.52), M['ten'])
    sekil('kure', 'bere', (0, 0, 1.2), (0.62, 0.56, 0.42), M['bere'])
    sekil('silindir', 'kivrim', (0, 0, 1.0), (0.6, 0.54, 0.1), M['pon'])
    sekil('kure', 'pon', (0, 0.05, 1.72), (0.17, 0.17, 0.17), M['pon'])
    for yan in (-1, 1):
        g = sekil('kure', 'goz', (0.2 * yan, -0.48, 1.0), (0.09, 0.05, 0.13), M['goz'], cizgi=False)
        sekil('kure', 'parilti', (0.2 * yan + 0.03, -0.52, 1.05), (0.03, 0.02, 0.04), M['pon'], cizgi=False)
        sekil('kure', 'yanak', (0.34 * yan, -0.43, 0.88), (0.1, 0.04, 0.07), toon('yanak', (1.0, 0.5, 0.5)), cizgi=False)
    # kollar
    kol_aci = {'dur': (8, 8), 'kos': (-55, 55), 'zipla': (-150, -150)}[poz]
    for yan, a in zip((-1, 1), kol_aci):
        k = sekil('kutu', 'kol', (0.62 * yan, 0, -0.1), (0.14, 0.14, 0.34), M['parka'], 0.05)
        k.location = (0.62 * yan, 0, 0.18); k.rotation_euler = (math.radians(a), 0, math.radians(-12 * yan))
        # pivot'u omuza almak için kolu ve eldiveni bir parent ile döndür
        el = sekil('kure', 'eldiven', (0, 0, -0.38), (0.13, 0.13, 0.13), M['parka2']); el.parent = k; el.location = (0, 0, -1.2)
    # bacaklar + botlar
    bac_aci = {'dur': (0, 0), 'kos': (35, -35), 'zipla': (-35, 20)}[poz]
    for yan, a in zip((-1, 1), bac_aci):
        b = sekil('kutu', 'bacak', (0.24 * yan, 0, -0.95), (0.16, 0.16, 0.36), M['pantolon'], 0.05)
        b.rotation_euler = (math.radians(a), 0, 0)
        bt = sekil('kutu', 'bot', (0.24 * yan, -0.08 + 0.45 * math.sin(math.radians(a)) * -0.0, -1.42), (0.2, 0.28, 0.14), M['bot'], 0.05)
        bt.location = (0.24 * yan, -0.1 - 0.4 * math.sin(math.radians(a)), -1.05 - 0.4 * math.cos(math.radians(a)))
    render('karakter_' + poz)

for p in ('dur', 'kos', 'zipla'): karakter(p)

# --- Platform: yuvarlatılmış buz blok, üstte kar, altta sarkıtlar ---
temizle(); sahne(256, 64, 7.6)
buz = toon('buz', (0.55, 0.85, 1.0)); kar = toon('kar', (0.97, 0.99, 1.0)); koyu = toon('buz2', (0.3, 0.62, 0.9))
sekil('kutu', 'blok', (0, 0, 0), (3.6, 0.9, 0.42), buz, 0.14)
sekil('kutu', 'kar', (0, -0.05, 0.42), (3.7, 0.95, 0.14), kar, 0.12)
for i in range(7):
    x = -3.0 + i * 1.0; h = 0.28 + 0.16 * ((i * 5) % 3)
    s = sekil('silindir', 'sarkit', (x, 0, -0.42 - h), (0.14, 0.14, h), koyu); s.rotation_euler = (math.pi, 0, 0)
render('platform')
print('SPRITE_TAMAM', cikti)
