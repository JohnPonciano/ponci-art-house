/** Largura e altura de JPEG, PNG ou TIFF lendo só o cabeçalho (sem decodificar arquivos de 50 MB no navegador). */
export async function imageDims(file: File): Promise<{ w: number; h: number } | null> {
  const head = new DataView(await file.slice(0, 16).arrayBuffer());
  if (head.byteLength < 12) return null;
  // PNG: assinatura + IHDR
  if (head.getUint32(0) === 0x89504e47) { const d = new DataView(await file.slice(16, 24).arrayBuffer()); return { w: d.getUint32(0), h: d.getUint32(4) }; }
  // JPEG: procura o SOF
  if (head.getUint16(0) === 0xffd8) {
    const d = new DataView(await file.slice(0, Math.min(file.size, 4 << 20)).arrayBuffer()); let i = 2;
    while (i + 9 < d.byteLength) {
      if (d.getUint8(i) !== 0xff) { i++; continue; }
      const m = d.getUint8(i + 1);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: d.getUint16(i + 5), w: d.getUint16(i + 7) };
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      i += 2 + d.getUint16(i + 2);
    }
    return null;
  }
  // TIFF: II* ou MM*, primeira IFD (pode estar no fim do arquivo)
  const le = head.getUint16(0) === 0x4949; if (!le && head.getUint16(0) !== 0x4d4d) return null;
  const d = new DataView(await file.arrayBuffer());
  const u16 = (o: number) => d.getUint16(o, le), u32 = (o: number) => d.getUint32(o, le);
  if (u16(2) !== 42) return null;
  const ifd = u32(4), n = u16(ifd); let w = 0, h = 0;
  for (let k = 0; k < n; k++) {
    const e = ifd + 2 + k * 12, tag = u16(e), type = u16(e + 2), val = type === 3 ? u16(e + 8) : u32(e + 8);
    if (tag === 256) w = val; if (tag === 257) h = val;
  }
  return w && h ? { w, h } : null;
}
