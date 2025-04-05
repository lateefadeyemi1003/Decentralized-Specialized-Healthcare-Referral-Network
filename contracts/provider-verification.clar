;; Provider Verification Contract
;; This contract validates and stores credentials of medical specialists

;; Data Maps
(define-map providers
  {provider-id: uint}
  {name: (string-ascii 64),
   specialty: (string-ascii 64),
   license-number: (string-ascii 32),
   is-verified: bool,
   verification-date: uint,
   credentials: (list 10 (string-ascii 128)),
   rating: uint})

;; Error Codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ALREADY_REGISTERED u2)
(define-constant ERR_NOT_FOUND u3)

;; Variables
(define-data-var admin principal tx-sender)
(define-data-var next-provider-id uint u1)

;; Read-only functions
(define-read-only (get-provider (provider-id uint))
  (map-get? providers {provider-id: provider-id}))

(define-read-only (is-provider-verified (provider-id uint))
  (default-to false (get is-verified (get-provider provider-id))))

(define-read-only (get-provider-by-id (provider-id uint))
  (map-get? providers {provider-id: provider-id}))

;; Public functions
(define-public (register-provider
                (name (string-ascii 64))
                (specialty (string-ascii 64))
                (license-number (string-ascii 32))
                (credentials (list 10 (string-ascii 128))))
  (let ((provider-id (var-get next-provider-id)))
    (asserts! (is-none (get-provider provider-id)) (err ERR_ALREADY_REGISTERED))

    (map-set providers
      {provider-id: provider-id}
      {name: name,
       specialty: specialty,
       license-number: license-number,
       is-verified: false,
       verification-date: u0,
       credentials: credentials,
       rating: u0})

    (var-set next-provider-id (+ provider-id u1))
    (ok provider-id)))

(define-public (verify-provider (provider-id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some (get-provider provider-id)) (err ERR_NOT_FOUND))

    (map-set providers
      {provider-id: provider-id}
      (merge (unwrap-panic (get-provider provider-id))
             {is-verified: true,
              verification-date: block-height}))
    (ok true)))

(define-public (update-provider-credentials
                (provider-id uint)
                (credentials (list 10 (string-ascii 128))))
  (begin
    (asserts! (is-some (get-provider provider-id)) (err ERR_NOT_FOUND))
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))

    (map-set providers
      {provider-id: provider-id}
      (merge (unwrap-panic (get-provider provider-id))
             {credentials: credentials,
              is-verified: false}))
    (ok true)))

(define-public (update-provider-rating (provider-id uint) (rating uint))
  (begin
    (asserts! (is-some (get-provider provider-id)) (err ERR_NOT_FOUND))

    (map-set providers
      {provider-id: provider-id}
      (merge (unwrap-panic (get-provider provider-id))
             {rating: rating}))
    (ok true)))

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set admin new-admin)
    (ok true)))

