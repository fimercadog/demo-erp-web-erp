import View from './view'

export function generateStaticParams() { return [{ id: '1' }] }

export default function Page() {
  return <View />
}
