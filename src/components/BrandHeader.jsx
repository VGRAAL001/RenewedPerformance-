import Logo from './Logo'

function BrandHeader({ eyebrow, title }) {
  return <div className="brand-page-header"><Logo /><span className="header-rule" aria-hidden="true" /><div className="brand-page-heading"><span>{eyebrow}</span><h1>{title}</h1></div><span className="title-streaks" aria-hidden="true" /><span className="corner-stripe" aria-hidden="true" /></div>
}

export default BrandHeader