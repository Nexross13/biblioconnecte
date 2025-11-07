import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UsersIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { fetchPublicOverview } from '../api/stats'

const statFormatter = new Intl.NumberFormat('fr-FR')

const formatStat = (value) => (Number.isFinite(value) ? statFormatter.format(value) : '—')

const Footer = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-overview'],
    queryFn: fetchPublicOverview,
    staleTime: 1000 * 60 * 10,
  })

  const counts = data?.counts ?? {}

  const highlightedStats = useMemo(
    () => [
      {
        label: 'Lecteurs actifs',
        value: counts.members,
        icon: UsersIcon,
      },
      {
        label: 'Livres partagés',
        value: counts.books,
        icon: BookOpenIcon,
      },
      {
        label: 'Avis publiés',
        value: counts.reviews,
        icon: ChatBubbleLeftRightIcon,
      },
    ],
    [counts.members, counts.books, counts.reviews],
  )

  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 text-center md:px-6 lg:py-16 lg:text-left">
        <div className="grid gap-10 justify-items-center sm:grid-cols-2 lg:grid-cols-4 lg:items-start lg:justify-items-center">
          <div className="w-full max-w-sm space-y-4 sm:max-w-none">
            <h2 className="text-xl font-semibold text-white">My BiblioConnect</h2>
            <p className="text-sm text-slate-300">
              La communauté où les lecteurs partagent leurs coups de cœur, suivent leurs amis et
              proposent les prochaines pépites du catalogue.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2 sm:max-w-none lg:justify-self-center lg:border-l lg:border-white/10 lg:pl-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Communauté
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <Link className="transition hover:text-white" to="/register">
                  Rejoindre la plateforme
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/login">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/books/new">
                  Proposer un livre
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" to="/library">
                  Espace membres
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full max-w-xs space-y-2 sm:max-w-none lg:justify-self-center lg:border-l lg:border-white/10 lg:pl-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Ressources
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <a
                  className="flex items-center justify-center gap-2 transition hover:text-white lg:justify-start"
                  href="https://api.my-biblioconnect.fr/api-docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation API
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
              <li>
                <span className="text-slate-400 line-through decoration-dotted decoration-white/40">
                  Guide de démarrage (bientôt)
                </span>
              </li>
              <li>
                <span className="text-slate-400 line-through decoration-dotted decoration-white/40">
                  Journal de la communauté (bientôt)
                </span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsPrivacyOpen(true)}
                  className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Politique de confidentialité
                </button>
              </li>
            </ul>
          </div>

          <div className="w-full max-w-sm sm:max-w-none lg:justify-self-center lg:border-l lg:border-white/10 lg:pl-10">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/60">Vue d’ensemble</p>
              <div className="space-y-3">
                {highlightedStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm text-white/80">{label}</p>
                      <p className="text-lg font-semibold text-white">
                        {isLoading ? (
                          <span className="block h-6 w-16 animate-pulse rounded bg-white/20" />
                        ) : isError ? (
                          '—'
                        ) : (
                          formatStat(value)
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {isError ? (
                <p className="text-xs text-white/60">
                  Les statistiques publiques sont momentanément indisponibles.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-white/70 text-center md:flex-row md:items-center md:justify-between md:px-6 md:text-left">
          <p>© {currentYear} My BiblioConnect. Tous droits réservés.</p>
          <p>
            Projet communautaire pour partager, explorer et recommander des livres entre passionnés.
          </p>
        </div>
      </div>
      {isPrivacyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-left text-slate-700 shadow-xl dark:bg-slate-900 dark:text-slate-200">
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute right-4 top-4 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Fermer
            </button>
            <h2 id="privacy-modal-title" className="text-2xl font-semibold text-primary">
              Politique de confidentialité
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Cette politique décrit la manière dont My BiblioConnect collecte, utilise et protège vos
              données personnelles. Elle s’applique à l’ensemble des services proposés sur la
              plateforme.
            </p>
            <div className="mt-6 space-y-6 text-sm leading-relaxed">
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  1. Responsable du traitement
                </h3>
                <p>
                  My BiblioConnect est édité par l’équipe produit en charge de la plateforme. Pour
                  toute question relative à la protection des données, vous pouvez nous contacter à
                  l’adresse&nbsp;:
                  <a
                    href="mailto:noreply.biblioconnect@gmail.com"
                    className="ml-1 text-primary underline hover:text-primary/80"
                  >
                    noreply.biblioconnect@gmail.com
                  </a>
                  .
                </p>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  2. Données collectées
                </h3>
                <ul className="list-disc pl-6">
                  <li>
                    <strong>Données d’identification</strong> : prénom, nom, adresse e-mail,
                    identifiants de connexion.
                  </li>
                  <li>
                    <strong>Données de profil</strong> : avatar, biographie, préférences littéraires.
                  </li>
                  <li>
                    <strong>Données d’activité</strong> : livres enregistrés, avis publiés, listes
                    de souhaits, interactions sociales.
                  </li>
                  <li>
                    <strong>Données techniques</strong> : adresses IP, logs de connexion, type de
                    navigateur.
                  </li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  3. Finalités et bases légales
                </h3>
                <ul className="list-disc pl-6">
                  <li>Gestion du compte utilisateur et accès aux services (exécution du contrat).</li>
                  <li>
                    Personnalisation des recommandations et communications (intérêt légitime ou
                    consentement selon le cas).
                  </li>
                  <li>Modération des contenus et sécurité de la plateforme (intérêt légitime).</li>
                  <li>
                    Statistiques anonymisées pour améliorer l’expérience (intérêt légitime).
                  </li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  4. Durées de conservation
                </h3>
                <p>
                  Les données sont conservées pendant la durée de votre inscription. Les informations
                  relatives aux contributions (avis, propositions) peuvent être anonymisées à la
                  suppression du compte afin de préserver la cohérence des échanges.
                </p>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  5. Partage et sous-traitance
                </h3>
                <p>
                  My BiblioConnect ne revend pas vos données. Elles peuvent être transmises à des
                  prestataires techniques (hébergement, analytics) strictement nécessaires au bon
                  fonctionnement du service, contractuellement engagés au respect de la
                  confidentialité.
                </p>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  6. Sécurité
                </h3>
                <p>
                  Nous mettons en œuvre des mesures organisationnelles et techniques appropriées
                  (chiffrement, contrôle des accès, audits réguliers) pour protéger vos informations
                  contre tout accès non autorisé, divulgation, altération ou destruction.
                </p>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  7. Vos droits
                </h3>
                <p>Conformément à la réglementation, vous disposez des droits suivants :</p>
                <ul className="list-disc pl-6">
                  <li>Droit d’accès, de rectification et de suppression de vos données.</li>
                  <li>Droit de limiter ou de vous opposer à certains traitements.</li>
                  <li>Droit à la portabilité de vos informations.</li>
                  <li>
                    Droit d’introduire une réclamation auprès de la CNIL si vous estimez que vos
                    droits ne sont pas respectés.
                  </li>
                </ul>
                <p className="mt-2">
                  Pour exercer ces droits, contactez-nous à&nbsp;
                  <a
                    href="mailto:noreply.biblioconnect@gmail.com"
                    className="text-primary underline hover:text-primary/80"
                  >
                    noreply.biblioconnect@gmail.com
                  </a>
                  .
                </p>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-primary dark:text-primary">
                  8. Mise à jour de la politique
                </h3>
                <p>
                  Cette politique peut évoluer pour tenir compte des évolutions légales ou des
                  services proposés. Les utilisateurs seront notifiés de toute modification
                  substantielle au moins 30 jours avant son entrée en vigueur.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default Footer
