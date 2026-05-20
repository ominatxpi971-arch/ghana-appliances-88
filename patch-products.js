const fs = require('fs');
const path = 'D:/codex ai/ghana-appliances/src/app/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Add BRANDS constant after PRICE_RANGES
c = c.replace(
  'const PRICE_RANGES = [',
  'const BRANDS = [' +
  '{ value: "all", label: "All Brands" },' +
  '{ value: "Samsung", label: "Samsung" },' +
  '{ value: "LG", label: "LG" },' +
  '{ value: "TCL", label: "TCL" },' +
  '{ value: "Hisense", label: "Hisense" },' +
  '{ value: "Midea", label: "Midea" },' +
  '{ value: "Gree", label: "Gree" },' +
  '{ value: "Bosch", label: "Bosch" },' +
  '{ value: "Philips", label: "Philips" },' +
  '{ value: "Binatone", label: "Binatone" },' +
  '{ value: "Kenwood", label: "Kenwood" },' +
  '{ value: "Nexus", label: "Nexus" },' +
  ']' + String.fromCharCode(10) + String.fromCharCode(10) + 'const PRICE_RANGES = ['
);

// Add brand state
c = c.replace(
  'const [priceRange, setPriceRange] = useState("all")',
  'const [priceRange, setPriceRange] = useState("all")' + String.fromCharCode(10) + '  const [brand, setBrand] = useState("all")'
);

// Add brand filter logic in useMemo
c = c.replace(
  'if (priceRange !== "all") {',
  'if (brand !== "all") list = list.filter(p => p.name.toLowerCase().includes(brand.toLowerCase()))' + String.fromCharCode(10) + '    if (priceRange !== "all") {'
);

// Update useMemo deps
c = c.replace(
  '}, [products, search, category, sort, priceRange])',
  '}, [products, search, category, sort, priceRange, brand])'
);

// Add brand Select after priceRange Select closing </Select>
// Find priceRange SelectContent closing and add brand filter
const priceSelIdx = c.indexOf('{PRICE_RANGES.map');
if (priceSelIdx > -1) {
  // Find the </Select> after this
  const afterPrice = c.indexOf('</Select>', priceSelIdx);
  if (afterPrice > -1) {
    const brandUI = String.fromCharCode(10) +
      '        <Select value={brand} onValueChange={(v) => setBrand(v ?? "all")}>' + String.fromCharCode(10) +
      '          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>' + String.fromCharCode(10) +
      '          <SelectContent>{BRANDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>' + String.fromCharCode(10) +
      '        </Select>';
    c = c.slice(0, afterPrice + '</Select>'.length) + brandUI + c.slice(afterPrice + '</Select>'.length);
  }
}

// Update clear filters to include setBrand
c = c.replace(
  'setCategory("all"); setPriceRange("all")',
  'setCategory("all"); setPriceRange("all"); setBrand("all")'
);

fs.writeFileSync(path, c);
console.log('brand filter added successfully');