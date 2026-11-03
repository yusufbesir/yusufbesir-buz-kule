# description: Blender ile özgün 3B karakter ve platformu piksel sanatı sprite'larına render eder. sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
# Çalıştırma: blender.exe -b -P arac/blender_sprite.py -- <çıktı_klasörü>
import bpy, math, sys, os

cikti = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(os.getcwd(), 'varlik')
os.makedirs(cikti, exist_ok=True)

def temizle():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def malzeme(ad, renk, parlak=0.4):
    m = bpy.data.materials.new(ad); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*renk, 1); b.inputs['Roughness'].default_value = parlak
    return m

def kutu(ad, boyut, konum, mat):
    bpy.ops.mesh.primitive_cube_add(location=konum); o = bpy.context.object; o.name = ad
    o.scale = (boyut[0] / 2, boyut[1] / 2, boyut[2] / 2); o.data.materials.append(mat)
    bev = o.modifiers.new('b', 'BEVEL'); bev.width = 0.04; bev.segments = 2
    return o

def kure(ad, r, konum, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=konum, segments=16, ring_count=10)
    o = bpy.context.object; o.name = ad; o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o

def sahne(genislik, yukseklik, olcek):
    s = bpy.context.scene
    s.render.engine = 'BLENDER_EEVEE_NEXT'; s.render.film_transparent = True
    s.render.resolution_x, s.render.resolution_y = genislik, yukseklik; s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGBA'
    s.view_settings.view_transform = 'Standard'; s.view_settings.look = 'None'  # AgX renkleri soldurur
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = olcek
    co = bpy.data.objects.new('c', cam); bpy.context.collection.objects.link(co)
    co.location = (0, -8, 0); co.rotation_euler = (math.radians(90), 0, 0); s.camera = co
    for ad, konum, guc in (('anahtar', (3, -5, 5), 380), ('dolgu', (-4, -5, 1), 110)):
        l = bpy.data.lights.new(ad, 'AREA'); l.energy = guc; l.size = 5
        lo = bpy.data.objects.new(ad, l); bpy.context.collection.objects.link(lo); lo.location = konum
        lo.rotation_euler = (math.radians(70), 0, math.radians(20))
    w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.25, 0.3, 0.45, 1); s.world = w

def render(ad):
    bpy.context.scene.render.filepath = os.path.join(cikti, ad + '.png'); bpy.ops.render.render(write_still=True)

# --- Karakter: bere takan, kırmızı kapüşonlu özgün bir "kar çocuğu" ---
def karakter(poz):
    temizle(); sahne(96, 128, 3.2)
    kirmizi, mavi, ten, koyu, beyaz = (malzeme('k', (0.9, 0.08, 0.08)), malzeme('m', (0.05, 0.3, 0.95)),
        malzeme('t', (0.95, 0.75, 0.6)), malzeme('d', (0.05, 0.05, 0.08)), malzeme('b', (0.95, 0.97, 1.0)))
    z = 0
    govde = kutu('govde', (0.9, 0.6, 1.0), (0, 0, -0.1), kirmizi)
    kafa = kure('kafa', 0.55, (0, 0, 0.85), ten)
    kure('bere', 0.6, (0, 0, 1.0), mavi).scale.z = 0.7
    kure('pon', 0.18, (0, 0, 1.6), beyaz)
    for yan in (-1, 1): kure('goz', 0.07, (0.18 * yan, -0.5, 0.9), koyu)
    el_y = {'dur': 0.0, 'kos': 0.35, 'zipla': 0.9}[poz]
    for yan in (-1, 1): kutu('kol', (0.22, 0.22, 0.7), (0.56 * yan, 0, -0.05 + el_y * yan * (1 if poz != 'zipla' else 0.3)), kirmizi)
    bacak = {'dur': 0.0, 'kos': 0.35, 'zipla': 0.2}[poz]
    for yan in (-1, 1): kutu('bacak', (0.3, 0.3, 0.7), (0.25 * yan, bacak * yan * 0.5, -0.95), koyu)
    render('karakter_' + poz)

for p in ('dur', 'kos', 'zipla'): karakter(p)

# --- Platform dilimi: buz blok ---
temizle(); sahne(64, 32, 4.0)
buz = malzeme('buz', (0.65, 0.88, 1.0), 0.1)
buz.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.4
kutu('plat', (3.6, 1.2, 0.8), (0, 0, 0), buz)
for i in range(5): kutu('sark', (0.2, 0.2, 0.3 + 0.1 * i), (-1.4 + i * 0.7, 0, -0.55 - 0.05 * i), buz)
render('platform')
print('SPRITE_TAMAM', cikti)
