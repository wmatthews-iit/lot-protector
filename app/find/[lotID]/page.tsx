import Lot from './Lot';

export const metadata = {
  title: '',
  description: '',
};

export default async function Page({ params }: { params: Promise<{ lotID: string }> }) {
  const lotID = (await params).lotID;
  
  return <Lot lotID={lotID} />;
}
