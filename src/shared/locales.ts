export const LOCALES = [ ['en','English'], ['es','Español'], ['hi','हिन्दी'], ['zh-Hans','简体中文'], ['fr','Français'] ] as const;
export type Locale = typeof LOCALES[number][0];
type Translations = readonly [string,string,string,string];
// Display dictionaries only. Original evidence and exact provider bytes never pass through this function.
export const DISPLAY: Record<string,Translations> = {
'PDF file required.':['Se requiere un archivo PDF.','PDF फ़ाइल आवश्यक है।','需要 PDF 文件。','Un fichier PDF est requis.'],
'Unsupported document. Choose a supported text PDF; scans, drawings and unrelated files are not accepted.':['Documento no compatible. Elige un PDF de texto admitido; no se aceptan escaneos, dibujos ni archivos ajenos.','असमर्थित दस्तावेज़। समर्थित टेक्स्ट PDF चुनें; स्कैन, चित्र और असंबंधित फ़ाइलें स्वीकार नहीं हैं।','不支持此文档。请选择支持的文本 PDF；不接受扫描件、绘画或无关文件。','Document non pris en charge. Choisissez un PDF texte accepté ; scans, dessins et fichiers sans rapport sont refusés.'],
'A case supports two PDFs. Reset to start another case.':['Un caso admite dos PDF. Reinicia para empezar otro caso.','एक मामले में दो PDF हैं। दूसरे मामले के लिए रीसेट करें।','每个案例支持两份 PDF。请重置以开始另一个案例。','Un dossier accepte deux PDF. Réinitialisez pour commencer un autre dossier.'],
'This PDF exceeds the 5 MiB file limit.':['Este PDF supera el límite de 5 MiB.','यह PDF 5 MiB सीमा से बड़ा है।','此 PDF 超过 5 MiB 限制。','Ce PDF dépasse la limite de 5 MiB.'],
'Camera permission':['Permiso de cámara','कैमरे की अनुमति','相机权限','Autorisation caméra'],
'Allow camera access to scan, or paste the pairing code.':['Permite acceso a la cámara o pega el código de enlace.','स्कैन के लिए कैमरा अनुमति दें या पेयरिंग कोड पेस्ट करें।','允许相机扫描，或粘贴配对码。','Autorisez la caméra pour scanner, ou collez le code d’association.'],
'Inspect included and excluded fields':['Inspeccionar campos incluidos y excluidos','शामिल और बाहर फ़ील्ड जाँचें','查看使用和排除的字段','Inspecter les champs inclus et exclus'],
'Hide evidence decisions':['Ocultar decisiones de evidencia','साक्ष्य निर्णय छिपाएँ','隐藏证据选择','Masquer les choix de preuves'],
'Reset':['Reiniciar','रीसेट','重置','Réinitialiser'],
'PRIVATE DOCUMENT REVIEW':['REVISIÓN PRIVADA DE DOCUMENTOS','निजी दस्तावेज़ समीक्षा','隐私文档审核','EXAMEN PRIVÉ DES DOCUMENTS'],
'Find the gaps.\nKeep the details here.':['Detecta lo que falta.\nMantén los datos aquí.','कमियाँ खोजें।\nनिजी जानकारी यहीं रखें।','找出缺漏。\n将隐私留在这里。','Repérez les lacunes.\nGardez les détails ici.'],
'Read supported PDFs on your iPhone. Check the evidence. Decide what AI receives.':['Lee los PDF compatibles en tu iPhone. Revisa las pruebas. Decide qué recibe la IA.','अपने iPhone पर समर्थित PDF पढ़ें। साक्ष्य जाँचें। तय करें कि AI को क्या मिले।','在 iPhone 上读取支持的 PDF，核查证据，决定 AI 接收什么。','Lisez les PDF pris en charge sur votre iPhone. Vérifiez les preuves. Décidez de ce que reçoit l’IA.'],
'Language':['Idioma','भाषा','语言','Langue'],
'Five display languages. Original documents stay in their original language.':['Cinco idiomas de interfaz. Los documentos conservan su idioma original.','इंटरफ़ेस की पाँच भाषाएँ। दस्तावेज़ अपनी मूल भाषा में रहते हैं।','五种界面语言。原始文档保留原语言。','Cinq langues d’affichage. Les documents conservent leur langue d’origine.'],
'1. Add documents':['1. Añadir documentos','1. दस्तावेज़ जोड़ें','1. 添加文档','1. Ajouter des documents'],
'Synthetic intake v1 / selected DE–EN Schengen layout + statement v1 • two text PDFs, 5 MiB each':['Formulario ficticio v1 / formato Schengen DE–EN seleccionado + extracto v1 • dos PDF de texto, 5 MiB cada uno','काल्पनिक इंटेक v1 / चुना गया DE–EN शेंगेन फ़ॉर्म + बैंक स्टेटमेंट v1 • दो टेक्स्ट PDF, प्रत्येक 5 MiB','模拟登记表 v1 / 指定德英申根表格 + 银行对账单 v1 • 两份文本 PDF，每份 5 MiB','Fiche fictive v1 / format Schengen DE–EN sélectionné + relevé v1 • deux PDF texte de 5 MiB chacun'],
'Address conflict':['Adresse distinta','पते में अंतर','地址冲突','Adresses différentes'],
'Matching':['Coincidentes','मेल खाते','一致','Concordance'],
'Missing fields':['Datos faltantes','जानकारी गायब','缺失字段','Champs manquants'],
'Embedded instruction':['Instrucción incrustada','दस्तावेज़ में निर्देश','嵌入指令','Instruction intégrée'],
'Visa + statement':['Visado + extracto','वीज़ा + स्टेटमेंट','签证表 + 对账单','Visa + relevé'],
'Visa name conflict':['Nombre de visado distinto','वीज़ा नाम में अंतर','签证姓名冲突','Nom du visa différent'],
'Visa missing passport':['Visado sin número de pasaporte','वीज़ा पासपोर्ट नंबर गायब','签证缺少护照号','Visa sans numéro de passeport'],
'Visa only':['Solo visado','केवल वीज़ा','仅签证表','Visa seul'],
'Load demo pair':['Cargar demostración','डेमो लोड करें','加载演示','Charger la démonstration'],
'Choose PDFs from Files':['Elegir PDF de Archivos','फ़ाइलों से PDF चुनें','从文件中选择 PDF','Choisir des PDF dans Fichiers'],
'Cancel':['Cancelar','रद्द करें','取消','Annuler'],
'Reading PDFs on this iPhone…':['Leyendo PDF en este iPhone…','इस iPhone पर PDF पढ़ रहे हैं…','正在此 iPhone 上读取 PDF…','Lecture des PDF sur cet iPhone…'],
'CLIENT INTAKE':['FORMULARIO DEL CLIENTE','क्लाइंट इंटेक','客户登记表','FICHE CLIENT'],
'BANK STATEMENT':['EXTRACTO BANCARIO','बैंक स्टेटमेंट','银行对账单','RELEVÉ BANCAIRE'],
'SCHENGEN APPLICATION':['SOLICITUD SCHENGEN','शेंगेन आवेदन','申根申请表','DEMANDE SCHENGEN'],
'Not supplied':['No proporcionado','नहीं दिया गया','未提供','Non fourni'],
'Name':['Nombre','नाम','姓名','Nom'],
'Mailing address':['Dirección postal','डाक पता','邮寄地址','Adresse postale'],
'Applicant ID':['ID del solicitante','आवेदक ID','申请人编号','Identifiant du demandeur'],
'Account number':['Número de cuenta','खाता संख्या','账号','Numéro de compte'],
'Balance':['Saldo','शेष राशि','余额','Solde'],
'Currency':['Moneda','मुद्रा','币种','Devise'],
'Balance as of':['Fecha del saldo','शेष राशि की तारीख','余额日期','Date du solde'],
'Period start':['Inicio del período','अवधि की शुरुआत','期间开始','Début de période'],
'Period end':['Fin del período','अवधि का अंत','期间结束','Fin de période'],
'Birth date':['Fecha de nacimiento','जन्म तिथि','出生日期','Date de naissance'],
'Travel document number':['Número del documento de viaje','यात्रा दस्तावेज़ संख्या','旅行证件号码','Numéro du document de voyage'],
'Travel document issued':['Fecha de expedición','यात्रा दस्तावेज़ जारी','旅行证件签发日期','Date de délivrance'],
'Travel document expires':['Fecha de caducidad','यात्रा दस्तावेज़ की समाप्ति','旅行证件到期日期','Date d’expiration'],
'Arrival date':['Fecha de llegada','आगमन तिथि','抵达日期','Date d’arrivée'],
'Departure date':['Fecha de salida','प्रस्थान तिथि','离境日期','Date de départ'],
'Destination':['Destino','गंतव्य','目的地','Destination'],
'Review':['Revisar','समीक्षा','审核','Vérifier'],
'Source':['Fuente','स्रोत','来源','Source'],
'Hide other fields':['Ocultar otros campos','अन्य फ़ील्ड छिपाएँ','隐藏其他字段','Masquer les autres champs'],
'Account, dates & other fields':['Cuenta, fechas y otros campos','खाता, तारीखें और अन्य जानकारी','账号、日期及其他字段','Compte, dates et autres champs'],
'2. Review the differences':['2. Revisar las diferencias','2. अंतर जाँचें','2. 检查差异','2. Vérifier les différences'],
'Load a supported intake/visa and statement, or a visa alone for its own checks.':['Carga un formulario/visado compatible y un extracto, o solo un visado para revisarlo.','समर्थित इंटेक/वीज़ा और स्टेटमेंट लोड करें, या केवल वीज़ा की जाँच करें।','加载支持的登记表或签证表及对账单，也可单独检查签证表。','Chargez une fiche ou un visa pris en charge et un relevé, ou un visa seul pour ses propres contrôles.'],
'Applicant / account holder':['Solicitante / titular','आवेदक / खाताधारक','申请人 / 账户持有人','Demandeur / titulaire'],
'Intake required fields':['Campos del formulario','इंटेक के आवश्यक फ़ील्ड','登记表必填字段','Champs requis de la fiche'],
'Statement required fields':['Campos del extracto','स्टेटमेंट के आवश्यक फ़ील्ड','对账单必填字段','Champs requis du relevé'],
'Declared / closing balance':['Saldo declarado / final','घोषित / अंतिम शेष','申报余额 / 期末余额','Solde déclaré / final'],
'Selected visa fields':['Campos de visado seleccionados','चुने गए वीज़ा फ़ील्ड','选定的签证字段','Champs de visa sélectionnés'],
'Visa date ordering':['Orden de fechas del visado','वीज़ा तारीखों का क्रम','签证日期顺序','Ordre des dates du visa'],
'consistent':['coincidente','मेल खाते','一致','cohérent'], 'conflicting':['distinto','अंतर','冲突','différent'], 'absent':['faltante','गायब','缺失','absent'], 'needs review':['requiere revisión','समीक्षा आवश्यक','需审核','à vérifier'], 'not comparable':['no comparable','तुलना नहीं हो सकती','不可比较','non comparable'],
'Both values match after spacing and case normalization.':['Los valores coinciden al normalizar espacios y mayúsculas.','स्पेस और अक्षरों का आकार सामान्य करने पर दोनों मान मेल खाते हैं।','统一空格及大小写后，两者一致。','Les valeurs concordent après normalisation des espaces et de la casse.'],
'The values differ. Ask the client to confirm; a difference does not establish which document is correct.':['Los valores difieren. Pide confirmación al cliente; la diferencia no indica cuál es correcto.','मान अलग हैं। क्लाइंट से पुष्टि लें; अंतर से सही दस्तावेज़ तय नहीं होता।','数值不同。请客户确认；差异不能说明哪份文档正确。','Les valeurs diffèrent. Demandez confirmation au client ; cela ne détermine pas quel document est correct.'],
'A value is missing from at least one document.':['Falta un valor en al menos un documento.','कम से कम एक दस्तावेज़ में जानकारी गायब है।','至少一份文档缺少信息。','Une valeur manque dans au moins un document.'],
'The extraction is ambiguous. Review the source and confirm a value.':['La extracción es ambigua. Revisa la fuente y confirma el valor.','निकाली गई जानकारी अस्पष्ट है। स्रोत जाँचकर मान की पुष्टि करें।','提取结果不明确。请查看来源并确认。','L’extraction est ambiguë. Vérifiez la source et confirmez la valeur.'],
'The sample workflow fields are present.':['Los campos del flujo de ejemplo están presentes.','उदाहरण कार्यप्रवाह की जानकारी मौजूद है।','示例流程所需字段已提供。','Les champs du scénario d’exemple sont présents.'],
'One or more fields need human review.':['Uno o más campos requieren revisión humana.','एक या अधिक फ़ील्ड की मानवीय समीक्षा आवश्यक है।','一个或多个字段需要人工审核。','Un ou plusieurs champs nécessitent une vérification humaine.'],
'Balances match for the same account, currency and closing date.':['Los saldos coinciden para la misma cuenta, moneda y fecha final.','एक ही खाते, मुद्रा और अंतिम तारीख के शेष मेल खाते हैं।','同一账号、币种和期末日期的余额一致。','Les soldes concordent pour le même compte, la même devise et la même date de clôture.'],
'Balances differ for the same account, currency and closing date. Review both values.':['Los saldos difieren para la misma cuenta, moneda y fecha. Revisa ambos.','एक ही खाते, मुद्रा और अंतिम तारीख के शेष अलग हैं। दोनों जाँचें।','同一账号、币种和日期的余额不同。请检查两者。','Les soldes diffèrent pour le même compte, la même devise et la même date. Vérifiez les deux.'],
'Not comparable: account, currency and an unambiguous as-of / closing date must match, and the statement period must be valid. Monthly income is never compared.':['No comparable: deben coincidir cuenta, moneda y fecha del saldo, con un período válido. No se compara el ingreso mensual.','तुलना के लिए खाता, मुद्रा और शेष की तारीख समान तथा स्टेटमेंट अवधि सही होनी चाहिए। मासिक आय की तुलना नहीं होती।','不可比较：账号、币种和明确的余额日期必须一致，且账期有效。不比较月收入。','Non comparable : le compte, la devise et la date du solde doivent concorder, avec une période valide. Le revenu mensuel n’est jamais comparé.'],
'Sample consistency checks. Human decisions; no authenticity or eligibility determination.':['Controles de coherencia de ejemplo. Decisiones humanas; no determinan autenticidad ni elegibilidad.','उदाहरण संगति जाँच। निर्णय इंसान लेता है; प्रामाणिकता या पात्रता तय नहीं होती।','示例一致性检查。由人工决定；不判定真伪或资格。','Contrôles de cohérence d’exemple. Décision humaine ; aucune détermination d’authenticité ou d’éligibilité.'],
'Proof Mode':['Modo de prueba','प्रमाण मोड','证明模式','Mode preuve'],
'Consistency review':['Revisión de coherencia','संगति समीक्षा','一致性审核','Examen de cohérence'],
'Prove Financial Resources':['Demostrar recursos financieros','वित्तीय संसाधन जाँचें','证明财务能力','Justifier les ressources financières'],
'Fictional sample policy: USD 3,000 minimum; statement ends within 45 days of 2026-10-03. Not a visa requirement.':['Política ficticia: mínimo de 3.000 USD; extracto cerrado en los 45 días anteriores al 03-10-2026. No es un requisito de visado.','काल्पनिक नीति: कम से कम USD 3,000; स्टेटमेंट का अंत 2026-10-03 से 45 दिनों के भीतर। यह वीज़ा नियम नहीं है।','模拟规则：至少 3,000 美元；对账单期末距 2026-10-03 不超过 45 天。这不是签证要求。','Règle fictive : minimum de 3 000 USD ; fin du relevé dans les 45 jours avant le 03/10/2026. Ce n’est pas une exigence de visa.'],
'Confirm selected evidence':['Confirmar las pruebas seleccionadas','चुने हुए साक्ष्य की पुष्टि करें','确认选定证据','Confirmer les preuves sélectionnées'],
'Identity consistency; literal name stays on phone.':['Coherencia de identidad; el nombre queda en el teléfono.','पहचान का मिलान; नाम फ़ोन पर रहता है।','检查身份一致性；具体姓名留在手机上。','Cohérence d’identité ; le nom reste sur le téléphone.'],
'Financial context evaluated locally; literal value stays on phone.':['Contexto financiero evaluado localmente; el valor queda en el teléfono.','वित्तीय संदर्भ की स्थानीय जाँच; वास्तविक मान फ़ोन पर रहता है।','财务信息在本地评估；具体数值留在手机上。','Contexte financier évalué localement ; la valeur reste sur le téléphone.'],
'Excluded from this purpose and AI.':['Excluido de este propósito y de la IA.','इस उद्देश्य और AI से बाहर।','此用途不需要，也不发给 AI。','Exclu de cet objectif et de l’IA.'],
'3. Inspect. Then explain.':['3. Inspeccionar. Luego explicar.','3. जाँचें। फिर समझाएँ।','3. 检查后再解释。','3. Inspecter. Puis expliquer.'],
'PDFs and literal values stay on this phone. Only template names, field/status enums and derived findings can leave it for the paired Mac.':['Los PDF y valores quedan en este teléfono. Solo nombres de formatos, categorías y resultados derivados van al Mac enlazado.','PDF और वास्तविक मान फ़ोन पर रहते हैं। केवल फ़ॉर्म प्रकार, फ़ील्ड/स्थिति श्रेणियाँ और निकाले गए निष्कर्ष जुड़े Mac तक जाते हैं।','PDF 和具体值留在手机上。仅格式名、字段与状态类别及派生结果传给配对的 Mac。','Les PDF et valeurs restent sur ce téléphone. Seuls les formats, catégories de champs et résultats dérivés vont au Mac associé.'],
'Withheld from AI: names, addresses, IDs, accounts, amounts, dates, notes, original filenames and source excerpts.':['La IA no recibe nombres, direcciones, IDs, cuentas, importes, fechas, notas, nombres de archivo ni fragmentos.','AI को नाम, पते, ID, खाते, रकम, तारीखें, नोट्स, फ़ाइल नाम और स्रोत अंश नहीं मिलते।','AI 不接收姓名、地址、证件号、账号、金额、日期、备注、原文件名或原文摘录。','L’IA ne reçoit pas les noms, adresses, identifiants, comptes, montants, dates, notes, noms de fichiers ni extraits.'],
'Pair Mac for local AI':['Enlazar Mac para IA local','स्थानीय AI के लिए Mac जोड़ें','配对 Mac 使用本地 AI','Associer le Mac pour l’IA locale'],
'Pair a different Mac':['Enlazar otro Mac','दूसरा Mac जोड़ें','配对另一台 Mac','Associer un autre Mac'],
'Check AI connection':['Comprobar conexión IA','AI कनेक्शन जाँचें','检查 AI 连接','Vérifier la connexion IA'],
'Preview exact AI request':['Ver solicitud exacta a la IA','AI का सटीक अनुरोध देखें','预览 AI 的确切请求','Voir la requête IA exacte'],
'View full exact request':['Ver solicitud completa','पूरा सटीक अनुरोध देखें','查看完整确切请求','Voir la requête exacte complète'],
'Exact API body; installed model also applies its own template. Any correction or reset clears approval.':['Cuerpo exacto de la API; el modelo aplica su plantilla. Corregir o reiniciar borra la aprobación.','API का सटीक अनुरोध; मॉडल अपना टेम्पलेट भी लगाता है। सुधार या रीसेट से अनुमति मिटती है।','这是确切的 API 请求体；模型还会应用自己的模板。修改或重置会取消批准。','Corps exact de l’API ; le modèle applique aussi son propre modèle de texte. Toute correction ou réinitialisation annule l’approbation.'],
'I reviewed this request and approve sending it to Ollama on the paired Mac.':['Revisé la solicitud y autorizo enviarla a Ollama en el Mac enlazado.','मैंने अनुरोध जाँचा है और जुड़े Mac पर Ollama को भेजने की अनुमति देता/देती हूँ।','我已检查此请求，同意发送到配对 Mac 上的 Ollama。','J’ai vérifié cette requête et j’autorise son envoi à Ollama sur le Mac associé.'],
'Send approved request':['Enviar solicitud aprobada','स्वीकृत अनुरोध भेजें','发送已批准请求','Envoyer la requête approuvée'],
'Show rule-based summary (no AI)':['Mostrar resumen por reglas (sin IA)','नियमों का सारांश दिखाएँ (AI नहीं)','显示规则摘要（无 AI）','Afficher le résumé par règles (sans IA)'],
'AI explanation • Ollama on Mac':['Explicación IA • Ollama en Mac','AI व्याख्या • Mac पर Ollama','AI 解释 • Mac 上的 Ollama','Explication IA • Ollama sur Mac'],
'Rule-based summary • no AI response':['Resumen por reglas • sin respuesta IA','नियमों का सारांश • AI उत्तर नहीं','规则摘要 • 非 AI 回答','Résumé par règles • aucune réponse IA'],
'Translated display of the validated model response. Exact request and canonical response remain unchanged.':['Traducción de la respuesta validada del modelo. La solicitud y respuesta originales no cambian.','मान्य मॉडल उत्तर का अनुवादित प्रदर्शन। सटीक अनुरोध और मूल उत्तर नहीं बदलते।','显示已验证模型回答的翻译。确切请求和原始回答保持不变。','Affichage traduit de la réponse validée du modèle. La requête exacte et la réponse originale restent inchangées.'],
'Generated by comparison rules. No model response.':['Generado por reglas de comparación. Sin respuesta del modelo.','तुलना नियमों से बना है। मॉडल का उत्तर नहीं।','由比较规则生成。不是模型回答。','Généré par les règles de comparaison. Aucune réponse du modèle.'],
'No stored cases. Reset clears this workspace. Original documents are visible to you; this prototype does not visually redact the source PDF.':['No se guardan casos. Reiniciar limpia el espacio. Ves los documentos originales; este prototipo no oculta visualmente sus datos.','मामले सेव नहीं होते। रीसेट कार्यक्षेत्र साफ़ करता है। मूल दस्तावेज़ आपको दिखते हैं; यह प्रोटोटाइप PDF को दृष्टिगत रूप से नहीं छिपाता।','不保存案例。重置会清空工作区。您可查看原始文档；此原型不会遮盖原 PDF 的内容。','Aucun dossier enregistré. Réinitialiser vide cet espace. Vous voyez les originaux ; ce prototype ne masque pas visuellement le PDF source.'],
'Exact model request':['Solicitud exacta al modelo','मॉडल का सटीक अनुरोध','确切模型请求','Requête exacte au modèle'],
'Close request':['Cerrar solicitud','अनुरोध बंद करें','关闭请求','Fermer la requête'],
'This changes the comparison value. The original PDF stays unchanged.':['Esto cambia el valor comparado. El PDF original no cambia.','इससे तुलना का मान बदलता है। मूल PDF नहीं बदलता।','这会修改用于比较的值。原 PDF 保持不变。','Cela modifie la valeur comparée. Le PDF original reste inchangé.'],
'Confirm value':['Confirmar valor','मान की पुष्टि करें','确认数值','Confirmer la valeur'],
'Close source':['Cerrar fuente','स्रोत बंद करें','关闭来源','Fermer la source'],
'Real source page and excerpt; no guessed highlight. Original private values remain visible to the human.':['Página y fragmento reales; sin resaltado supuesto. Los valores privados siguen visibles para la persona.','वास्तविक स्रोत पृष्ठ और अंश; अनुमानित हाइलाइट नहीं। निजी मान इंसान को दिखते हैं।','显示真实来源页面和摘录；没有猜测的高亮。人工审核者仍可查看原始隐私信息。','Page et extrait réels ; aucun surlignage supposé. Les valeurs privées restent visibles à la personne.'],
'Pair with your Mac':['Enlazar con tu Mac','अपने Mac से जोड़ें','与您的 Mac 配对','Associer votre Mac'],
'Keep the iPhone and Mac on the same Wi-Fi/hotspot. Open the private pairing QR generated on your Mac. No account or paid service needed.':['Mantén iPhone y Mac en la misma Wi-Fi. Abre el QR privado del Mac. El enlace no requiere una cuenta ni un servicio de pago.','iPhone और Mac को एक ही Wi-Fi पर रखें। Mac का निजी पेयरिंग QR खोलें। पेयरिंग के लिए खाते या भुगतान की जरूरत नहीं।','让 iPhone 和 Mac 连接同一 Wi-Fi。打开 Mac 生成的私密配对码。配对无需账户或付费服务。','Gardez l’iPhone et le Mac sur le même Wi-Fi. Ouvrez le QR privé du Mac. L’association ne nécessite aucun compte ni service payant.'],
'Scan Mac pairing QR':['Escanear QR del Mac','Mac पेयरिंग QR स्कैन करें','扫描 Mac 配对码','Scanner le QR du Mac'],
'Or paste the private pairing JSON from the Mac (simulator/manual).':['O pega el JSON privado del Mac (simulador/manual).','या Mac का निजी पेयरिंग JSON पेस्ट करें (सिम्युलेटर/मैनुअल)।','或粘贴 Mac 的私密配对 JSON（模拟器/手动）。','Ou collez le JSON privé du Mac (simulateur/manuel).'],
'Connect Mac':['Conectar Mac','Mac से कनेक्ट करें','连接 Mac','Connecter le Mac'],
'Close pairing':['Cerrar enlace','पेयरिंग बंद करें','关闭配对','Fermer l’association'],
'Preparing minimized request…':['Preparando solicitud mínima…','न्यूनतम अनुरोध तैयार हो रहा है…','正在准备最小化请求…','Préparation de la requête minimale…'],
'Ollama is explaining on your Mac…':['Ollama está explicando en tu Mac…','Ollama आपके Mac पर समझा रहा है…','Ollama 正在您的 Mac 上解释…','Ollama produit l’explication sur votre Mac…'],
'Some checks need human review before this case is considered complete.':['Algunos controles requieren revisión humana antes de completar el caso.','मामला पूरा मानने से पहले कुछ जाँचों की मानवीय समीक्षा आवश्यक है।','在认为此案例完整之前，部分检查需要人工审核。','Certains contrôles nécessitent une vérification humaine avant de considérer ce dossier comme complet.'],
'The available consistency checks are complete with no differences found.':['Los controles disponibles están completos y no se detectaron diferencias.','उपलब्ध संगति जाँच पूरी हैं और कोई अंतर नहीं मिला।','可执行的一致性检查已完成，未发现差异。','Les contrôles de cohérence disponibles sont complets, sans différence détectée.'],
'The compared information is consistent.':['La información comparada coincide.','तुलना की गई जानकारी मेल खाती है।','比较的信息一致。','Les informations comparées sont cohérentes.'],
'This check found no difference in the available information.':['Este control no encontró diferencias en la información disponible.','इस जाँच में उपलब्ध जानकारी में अंतर नहीं मिला।','此检查未发现现有信息存在差异。','Ce contrôle n’a trouvé aucune différence dans les informations disponibles.'],
'The documents contain different information; human review is needed.':['Los documentos contienen información distinta; se requiere revisión humana.','दस्तावेज़ों की जानकारी अलग है; मानवीय समीक्षा आवश्यक है।','文档中的信息不同；需要人工审核。','Les documents contiennent des informations différentes ; une vérification humaine est nécessaire.'],
'This difference needs clarification and does not show which document is correct.':['Esta diferencia necesita aclaración y no indica qué documento es correcto.','इस अंतर को स्पष्ट करना होगा; इससे सही दस्तावेज़ तय नहीं होता।','此差异需要澄清，不能说明哪份文档正确。','Cette différence nécessite une clarification et ne détermine pas quel document est correct.'],
'Required sample workflow information is missing.':['Falta información requerida por el flujo de ejemplo.','उदाहरण कार्यप्रवाह की आवश्यक जानकारी गायब है।','缺少示例流程所需的信息。','Des informations requises par le scénario d’exemple manquent.'],
'A missing value prevents a complete consistency review.':['Un valor faltante impide una revisión completa de coherencia.','गायब मान के कारण संगति समीक्षा पूरी नहीं हो सकती।','缺失信息导致一致性审核无法完成。','Une valeur manquante empêche un examen de cohérence complet.'],
'The available information needs human confirmation.':['La información disponible necesita confirmación humana.','उपलब्ध जानकारी की मानवीय पुष्टि आवश्यक है।','现有信息需要人工确认。','Les informations disponibles nécessitent une confirmation humaine.'],
'Ambiguous extraction or dates require a source check.':['Una extracción o fechas ambiguas requieren revisar la fuente.','अस्पष्ट जानकारी या तारीखों के लिए स्रोत जाँच आवश्यक है।','提取结果或日期不明确时，需要核查来源。','Une extraction ou des dates ambiguës nécessitent de vérifier la source.'],
'The balance cannot be compared with the available account, currency and date context.':['No se puede comparar el saldo con el contexto disponible de cuenta, moneda y fecha.','उपलब्ध खाते, मुद्रा और तारीख के संदर्भ से शेष की तुलना नहीं हो सकती।','现有账号、币种和日期信息不足以比较余额。','Le solde ne peut pas être comparé avec le contexte disponible de compte, devise et date.'],
'No balance conclusion can be drawn until comparable context is confirmed.':['No se puede concluir nada sobre el saldo hasta confirmar el contexto comparable.','तुलनीय संदर्भ की पुष्टि तक शेष पर निष्कर्ष नहीं निकाला जा सकता।','确认可比较的背景信息前，不能对余额作出结论。','Aucune conclusion sur le solde n’est possible avant confirmation d’un contexte comparable.'],
'Keep the source evidence for the human review.':['Conserva la evidencia para la revisión humana.','मानवीय समीक्षा के लिए स्रोत साक्ष्य रखें।','保留来源证据供人工审核。','Conservez les preuves pour la vérification humaine.'],
'Ask the client to confirm the current information.':['Pide al cliente que confirme la información actual.','क्लाइंट से वर्तमान जानकारी की पुष्टि माँगें।','请客户确认当前信息。','Demandez au client de confirmer les informations actuelles.'],
'Review both source passages before making a correction.':['Revisa ambos fragmentos antes de corregir.','सुधार से पहले दोनों स्रोत अंश जाँचें।','修改前请查看两处原文。','Vérifiez les deux extraits avant toute correction.'],
'Request the missing information from the client.':['Solicita al cliente la información faltante.','क्लाइंट से गायब जानकारी माँगें।','请客户补充缺失信息。','Demandez au client les informations manquantes.'],
'Check the original page and confirm the extracted fields.':['Revisa la página original y confirma los campos extraídos.','मूल पृष्ठ जाँचें और निकाली गई जानकारी की पुष्टि करें।','检查原始页面并确认提取字段。','Vérifiez la page originale et confirmez les champs extraits.'],
'Confirm the same account, currency and as-of date before comparing balances.':['Confirma la misma cuenta, moneda y fecha antes de comparar saldos.','शेष की तुलना से पहले वही खाता, मुद्रा और तारीख की पुष्टि करें।','比较余额前，确认账号、币种和余额日期相同。','Confirmez le même compte, la même devise et la même date avant de comparer les soldes.'],
'Selected adult-tourism sample fields are missing. Check the source; this is not a complete official checklist.':['Faltan campos seleccionados del ejemplo de turismo para adultos. Revisa la fuente; no es una lista oficial completa.','वयस्क पर्यटन उदाहरण के चुने हुए फ़ील्ड गायब हैं। स्रोत जाँचें; यह पूरी आधिकारिक सूची नहीं है।','缺少成人旅游示例中的选定字段。请查看来源；这不是完整的官方清单。','Des champs sélectionnés de l’exemple de tourisme adulte manquent. Vérifiez la source ; ce n’est pas une liste officielle complète.'],
'Selected sample fields are present. Conditional fields, checkboxes and signatures are outside this adapter.':['Los campos seleccionados están presentes. Campos condicionales, casillas y firmas no están cubiertos.','चुने हुए फ़ील्ड मौजूद हैं। सशर्त फ़ील्ड, चेकबॉक्स और हस्ताक्षर शामिल नहीं हैं।','选定的示例字段已提供。此解析器不处理条件字段、复选框或签名。','Les champs sélectionnés sont présents. Les champs conditionnels, cases et signatures ne sont pas couverts.'],
'Selected dates are ordered under the sample policy. No visa eligibility conclusion is made.':['Las fechas están ordenadas según la política de ejemplo. No se determina elegibilidad de visado.','उदाहरण नीति के अनुसार तारीखों का क्रम सही है। वीज़ा पात्रता तय नहीं होती।','选定日期符合示例规则中的顺序。不判断签证资格。','Les dates sont ordonnées selon la règle d’exemple. Aucune conclusion sur l’éligibilité au visa.'],
'Missing, ambiguous or reversed dates require a source check. No visa eligibility conclusion is made.':['Fechas faltantes, ambiguas o invertidas requieren revisar la fuente. No se determina elegibilidad.','गायब, अस्पष्ट या उलटी तारीखों के लिए स्रोत जाँचें। वीज़ा पात्रता तय नहीं होती।','日期缺失、不明确或顺序颠倒时需要核查来源。不判断签证资格。','Des dates manquantes, ambiguës ou inversées nécessitent de vérifier la source. Aucune conclusion sur l’éligibilité.'],
'Applicant and account-holder information needs human review. Compare both original passages.':['La información del solicitante y titular requiere revisión humana. Compara ambos fragmentos originales.','आवेदक और खाताधारक की जानकारी की मानवीय समीक्षा करें। दोनों मूल अंश जाँचें।','申请人与账户持有人的信息需要人工审核。请比较两处原文。','Les informations du demandeur et du titulaire nécessitent une vérification humaine. Comparez les deux extraits originaux.'],
'Confirmed evidence meets the fictional financial sample policy. This is not proof of visa eligibility.':['La evidencia confirmada cumple la política financiera ficticia. No demuestra elegibilidad de visado.','पुष्ट साक्ष्य काल्पनिक वित्तीय नीति को पूरा करते हैं। यह वीज़ा पात्रता का प्रमाण नहीं है।','已确认的证据符合模拟财务规则。这不证明签证资格。','Les preuves confirmées satisfont la règle financière fictive. Cela ne prouve pas l’éligibilité au visa.'],
'Financial evidence is missing, conflicting, unconfirmed or does not meet the fictional sample policy. Human review is required.':['La evidencia financiera falta, difiere, no está confirmada o no cumple la política ficticia. Se requiere revisión humana.','वित्तीय साक्ष्य गायब, अलग, अपुष्ट हैं या काल्पनिक नीति पूरी नहीं करते। मानवीय समीक्षा जरूरी है।','财务证据缺失、冲突、未确认或不符合模拟规则。需要人工审核。','Les preuves financières sont manquantes, contradictoires, non confirmées ou ne satisfont pas la règle fictive. Vérification humaine requise.'],
'Could not pair. Scan the private QR from your Mac and use the same Wi-Fi/hotspot.':['No se pudo enlazar. Escanea el QR privado del Mac en la misma Wi-Fi.','पेयरिंग नहीं हुई। एक ही Wi-Fi पर Mac का निजी QR स्कैन करें।','无法配对。请在同一 Wi-Fi 下扫描 Mac 的私密配对码。','Association impossible. Scannez le QR privé du Mac sur le même Wi-Fi.'],
};
export function translateDisplay(text: string,locale:Locale):string {
  if(locale==='en')return text;
  const index=LOCALES.findIndex(l=>l[0]===locale)-1;
  const direct=DISPLAY[text];if(direct)return direct[index];
  if(text==='Choose a PDF file.')return translateDisplay('PDF file required.',locale);
  if(/^Unsupported|no readable text layer|^This PDF has no readable|^Scans/.test(text))return translateDisplay('Unsupported document. Choose a supported text PDF; scans, drawings and unrelated files are not accepted.',locale);
  const source=/^(Source|Intake source|Statement source|Visa source) (.+)$/.exec(text);
  if(source)return `${[ 'Fuente','स्रोत','来源','Source' ][index]} ${source[1].startsWith('Intake')?translateDisplay('CLIENT INTAKE',locale):source[1].startsWith('Statement')?translateDisplay('BANK STATEMENT',locale):source[1].startsWith('Visa')?translateDisplay('SCHENGEN APPLICATION',locale):''} ${source[2]}`;
  const ready=/^(.+) • ready on Mac$/.exec(text);if(ready)return `${ready[1]} • ${['listo en Mac','Mac पर तैयार','Mac 上已就绪','prêt sur Mac'][index]}`;
  const paired=/^Paired Mac: (.+)\nEncrypted minimized facts cross Wi-Fi\. Model inference runs on that Mac\.$/.exec(text);
  if(paired)return `${['Mac enlazado','जुड़ा Mac','配对 Mac','Mac associé'][index]}: ${paired[1]}\n${['Solo hechos mínimos cifrados por Wi-Fi. La IA se ejecuta en ese Mac.','केवल एन्क्रिप्टेड न्यूनतम तथ्य Wi-Fi से जाते हैं। AI उस Mac पर चलता है।','仅加密的最小化事实通过 Wi-Fi 传输。AI 在该 Mac 上运行。','Seuls les faits minimisés chiffrés passent par Wi-Fi. L’IA s’exécute sur ce Mac.'][index]}`;
  const preview=/^Model destination on Mac: (.+)\nSHA-256 • five-minute, one-use approval$/.exec(text);
  if(preview)return `${['Destino del modelo en Mac','Mac पर मॉडल गंतव्य','Mac 上的模型地址','Destination du modèle sur Mac'][index]}: ${preview[1]}\nSHA-256 • ${['aprobación de un solo uso, cinco minutos','पाँच मिनट की एक बार अनुमति','五分钟有效，仅限一次批准','approbation unique, cinq minutes'][index]}`;
  const response=/^Real Ollama response • (.+) • ([\d.]+) s • validated$/.exec(text);
  if(response)return `${['Respuesta real de Ollama','वास्तविक Ollama उत्तर','真实 Ollama 回答','Réponse réelle d’Ollama'][index]} • ${response[1]} • ${response[2]} s • ${['validada','मान्य','已验证','validée'][index]}`;
  // Only known UI templates. Never used for values, filenames, source excerpts or serialized requests.
  const counts=/^(\d+) consistent checks • (hide|show)$/.exec(text);
  if(counts)return [ `${counts[1]} controles coincidentes • ${counts[2]==='hide'?'ocultar':'mostrar'}`,`${counts[1]} मेल खाते जाँच • ${counts[2]==='hide'?'छिपाएँ':'दिखाएँ'}`,`${counts[1]} 项一致 • ${counts[2]==='hide'?'隐藏':'显示'}`,`${counts[1]} contrôles cohérents • ${counts[2]==='hide'?'masquer':'afficher'}` ][index];
  const evidence=/^(\d+) source fields • (\d+) selected locally • (\d+) excluded • (\d+) derived findings prepared • 0 literal values in AI context$/.exec(text);
  if(evidence)return [ `${evidence[1]} campos • ${evidence[2]} seleccionados localmente • ${evidence[3]} excluidos • ${evidence[4]} resultados preparados • 0 valores literales en el contexto IA`,`${evidence[1]} स्रोत फ़ील्ड • ${evidence[2]} स्थानीय रूप से चुने • ${evidence[3]} बाहर • ${evidence[4]} निष्कर्ष तैयार • AI संदर्भ में 0 वास्तविक मान`,`${evidence[1]} 个来源字段 • 本地选用 ${evidence[2]} 个 • 排除 ${evidence[3]} 个 • 准备 ${evidence[4]} 个派生结果 • AI 上下文含 0 个具体值`,`${evidence[1]} champs sources • ${evidence[2]} sélectionnés localement • ${evidence[3]} exclus • ${evidence[4]} résultats préparés • 0 valeur littérale dans le contexte IA` ][index];
  const confirmed=/^(.+) • confirmed$/.exec(text);if(confirmed)return `${translateDisplay(confirmed[1],locale)} • ${['confirmado','पुष्ट','已确认','confirmé'][index]}`;
  const finding=/^(.+) • (consistent|conflicting|absent|needs review|not comparable)$/.exec(text);if(finding)return `${translateDisplay(finding[1],locale)} • ${translateDisplay(finding[2],locale)}`;
  const confirm=/^Confirm (.+)$/.exec(text);if(confirm)return `${['Confirmar','पुष्टि करें:','确认','Confirmer'][index]} ${translateDisplay(confirm[1],locale)}`;
  const page=/^Original PDF • page (\d+)$/.exec(text);if(page)return `${['PDF original • página','मूल PDF • पृष्ठ','原始 PDF • 第','PDF original • page'][index]} ${page[1]}`;
  const missing=/^Sample workflow fields missing: (.+)\.$/.exec(text);if(missing)return `${['Faltan campos de ejemplo:','उदाहरण फ़ील्ड गायब:','缺少示例字段：','Champs d’exemple manquants :'][index]} ${missing[1].split(', ').map(x=>translateDisplay(x,locale)).join(', ')}.`;
  return text;
}
