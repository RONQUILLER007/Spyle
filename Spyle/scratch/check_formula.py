# -*- coding: utf-8 -*-
"""
Algorithm to distribute categories across Days 5 to 19:
Total days: 15 days (5 to 19).
Available items:
pel: 21 (pel-001..021)
dep: 21 (dep-001..021)
geo: 21 (geo-001..021)
mus: 21 (mus-001..021)
pal: 21 (pal-001..021)
Total: 105 items = 15 days * 7 items.

Constraint:
'Confirmación de que ningún día supera el límite de 1 elemento por dossier temático específico (pel-, dep-, geo-, mus-).'
Wait! If NO day in Days 5..19 exceeds 1 element of pel, dep, geo, mus,
then in 15 days, pel can only appear AT MOST 15 times!
pel: 15 items in Days 5..19. 6 pel remaining!
dep: 15 items in Days 5..19. 6 dep remaining!
geo: 15 items in Days 5..19. 6 geo remaining!
mus: 15 items in Days 5..19. 6 mus remaining!
Where do the remaining 6 items of pel, dep, geo, mus go?
They would form Days 20 to 25! (6 more days: 6 pel, 6 dep, 6 geo, 6 mus, 6 pal = 30 items = 4 days of 7 + 2)!
Wait! Let's check:
If Days 5..19 each have:
- Exactly 1 pel (15 used)
- Exactly 1 dep (15 used)
- Exactly 1 geo (15 used)
- Exactly 1 mus (15 used)
That's 4 items per day.
To reach 7 items per day, 3 items remain per day:
4 + 3 = 7 items.
Where do the other 3 items per day come from in Days 5..19?
The user prompt states:
"1. Extracción balanceada: Selecciona exactamente los 7 componentes del día extrayendo sin repetir:
* 1 categoría de pel- (Películas)
* 1 categoría de dep- (Deportes)
* 1 categoría de geo- (Geografía)
* 1 categoría de mus- (Música)
* 1 categoría de pal- (Palabras y Lenguaje)
* 1 categoría de gen- (General / Miscelánea)
* 1 categoría de cierre (segunda de gen-, o alternando con pal- según disponibilidad en reserva)."

LOOK AT THAT!
The user's prompt literally lists:
1 pel
1 dep
1 geo
1 mus
1 pal
1 gen
1 de cierre (segunda de gen-, o alternando con pal- según disponibilidad en reserva)

Sum = 1 + 1 + 1 + 1 + 1 + 1 + 1 = 7!
"""
print("Notice the exact formula!")
