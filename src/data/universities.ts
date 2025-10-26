// University data for Milan
export interface University {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  image: string;
}

export const MILAN_UNIVERSITIES: University[] = [
  {
    id: 'bocconi',
    name: 'Bocconi University',
    shortName: 'Bocconi',
    lat: 45.4470,
    lng: 9.1905,
    image: '/src/assets/university-bocconi.png'
  },
  {
    id: 'cattolica',
    name: 'Università Cattolica',
    shortName: 'Cattolica',
    lat: 45.4630,
    lng: 9.1827,
    image: '/src/assets/university-cattolica.png'
  },
  {
    id: 'statale',
    name: 'La Statale',
    shortName: 'La Statale',
    lat: 45.4627,
    lng: 9.1900,
    image: '/src/assets/university-statale.png'
  },
  {
    id: 'politecnico',
    name: 'Politecnico di Milano',
    shortName: 'Politecnico',
    lat: 45.4784,
    lng: 9.2277,
    image: '/src/assets/university-politecnico.png'
  }
];