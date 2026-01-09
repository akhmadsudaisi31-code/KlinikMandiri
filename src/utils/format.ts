export const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

export const parseRupiah = (rupiahString: string) => {
  return parseInt(rupiahString.replace(/[^0-9]/g, ''), 10) || 0;
};
