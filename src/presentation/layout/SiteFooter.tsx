import { Link } from '@tanstack/react-router';
import { CATEGORIES, INITIAL_FILTERS } from '../shared/site';

export function SiteFooter() {
  return (
    <footer id="rodape" className="site-footer page-width">
      <div className="benefit-grid">
        <article>
          <span className="benefit-icon">W</span>
          <h3>Segurança da carteira</h3>
          <p>Proteja sua carteira e colecione arte digital verificada com confiança.</p>
        </article>
        <article id="criadores">
          <span className="benefit-icon">C</span>
          <h3>Criadores em destaque</h3>
          <p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p>
        </article>
        <article>
          <span className="benefit-icon">D</span>
          <h3>Alertas de lançamentos</h3>
          <p>
            Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
          </p>
        </article>
        <form className="newsletter" onSubmit={(event) => event.preventDefault()}>
          <h3>Antecipe-se ao próximo lançamento</h3>
          <div className="newsletter-input">
            <input aria-label="Seu e-mail" type="email" placeholder="digite seu e-mail..." />
            <button className="button">Enviar</button>
          </div>
          <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </form>
      </div>
      <div className="footer-band">
        <strong>KURIO</strong>
        <span>Feito para colecionadores, criadores e cultura</span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>
      <div className="footer-links">
        <div>
          <h3>Meu perfil</h3>
          <Link to="/profile">Meu perfil</Link>
          <Link to="/wallets">Carteiras</Link>
          <a href="#rodape">Lista de interesse</a>
        </div>
        <div>
          <h3>Central de ajuda</h3>
          <a href="#rodape">Como comprar NFTs</a>
          <a href="#rodape">Carteira e segurança</a>
          <a href="#rodape">Política do mercado</a>
        </div>
        <div>
          <h3>Coleções</h3>
          {CATEGORIES.slice(0, 5).map((category) => (
            <Link key={category} to="/" search={{ ...INITIAL_FILTERS, category }}>
              {category}
            </Link>
          ))}
        </div>
        <div>
          <h3>Redes sociais</h3>
          <p className="social-links">f　◎　♥　in</p>
          <h3>Carteiras compatíveis</h3>
          <small>METAMASK　·　WALLETCONNECT　·　COINBASE</small>
        </div>
      </div>
      <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  );
}
