const express = require('express');
const app = express();

const path = require('path');

const { version } = require('./package.json');

//* Database 
const { neon } = require('@neondatabase/serverless');

const { PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD } = process.env;
const sql = neon(`postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

//* Endpoints 
app.get('/', async (req, res) => {
	res.render('index');
});

app.get('/about', (req, res) => {
	res.render('about', { version });
});

app.get('/student', async (req, res) => {
	const students = await sql`
		SELECT
			s.id,
			s.full_name AS "fullName",
			s.slug,
			s.generation,

			(
				SELECT COALESCE(SUM(m.rank_order), 0)
				FROM delegates
				JOIN medals m ON delegates.medal_id = m.id
				WHERE student_id = s.id
			) AS "totalMedalWeight",

			(
				SELECT jsonb_object_agg(m.id, COALESCE(mc.cnt, 0))
				FROM medals m
				LEFT JOIN (
					SELECT medal_id, COUNT(*) AS cnt
					FROM delegates
					WHERE student_id = s.id AND medal_id IS NOT NULL
					GROUP BY medal_id
				) mc ON mc.medal_id = m.id
			) AS "medalCount",

			(
				SELECT COALESCE(
					jsonb_agg(
						jsonb_build_object (
							'year', h.year,
							'stageId', h.stage_id,
							'stage', h.stage_name,
							'medal', h.medal_id
						) ORDER BY h.year DESC, h.stage_order DESC
					),
					'[]'::jsonb
				)
				FROM (
					SELECT DISTINCT ON (d.year)
						d.year,
						d.stage_id,
						stg.display_name AS stage_name,
						stg.rank_order AS stage_order,
						d.medal_id
					FROM delegates d
					JOIN stages stg ON d.stage_id = stg.id
					WHERE d.student_id = s.id
					ORDER BY d.year ASC, stg.rank_order DESC
				) h
				-- JOIN stages stg ON h.stage_id = stg.id
			) AS "participations",

			(
				SELECT COALESCE(
					jsonb_agg(DISTINCT sub.display_name),
					'[]'::jsonb
				)
				FROM delegates d
				JOIN subjects sub ON d.subject_id = sub.id
				WHERE d.student_id = s.id
			) AS "subjects"
		FROM students s
		ORDER BY generation DESC, "totalMedalWeight" DESC, "fullName" ASC;
	`;

	const medals = await sql`
		SELECT
			id,
			display_name AS "displayName"
		FROM medals
		ORDER BY rank_order DESC;
	`;

	res.render('student-index', { students, medals });
});

app.get('/student/:studentSlug', async (req, res) => {
	const slug = req.params.studentSlug;

	const [student] = await sql`
		SELECT
			id,
			slug,
			full_name AS "fullName",
			generation
		FROM students WHERE slug = ${slug};
	`;

	if (!student) {
		return res.status(404).send('Student not found');
	}

	const delegates = await sql`
		SELECT
			s.full_name as "studentFullName",
			s.slug AS "studentSlug",
			sub.display_name AS "subjectName",
			stg.display_name AS "stageName",
			d.year,
			d.rank,
			d.medal_id AS "medalId",
			m.display_name AS "medal"
		FROM delegates d
		JOIN students s ON d.student_id = s.id
		JOIN subjects sub ON d.subject_id = sub.id
		JOIN stages stg ON d.stage_id = stg.id
		LEFT JOIN medals m ON d.medal_id = m.id
		WHERE d.student_id = ${student.id}
		ORDER BY d.year DESC, stg.rank_order DESC;
	`;

	res.render('student', { student, delegates });
});

app.get('/year', async (req, res) => {
	const years = await sql`
		SELECT
			y.year,

			(
				SELECT jsonb_object_agg(stg.id, COALESCE(sc.cnt, 0))
				FROM stages stg
				LEFT JOIN (
					SELECT stage_id, COUNT(*) AS cnt
					FROM delegates
					WHERE year = y.year
					GROUP BY stage_id
				) sc ON sc.stage_id = stg.id
			) AS "participantCount",

			(
				SELECT jsonb_object_agg(m.id, COALESCE(mc.cnt, 0))
				FROM medals m
				LEFT JOIN (
					SELECT medal_id, COUNT(*) AS cnt
					FROM delegates
					WHERE year = y.year AND medal_id IS NOT NULL
					GROUP BY medal_id
				) mc ON mc.medal_id = m.id
			) AS "medalCount",

			(
				SELECT COUNT(medal_id)
				FROM delegates
				WHERE year = y.year
			) AS "totalMedalCount"
		FROM (SELECT DISTINCT year FROM delegates WHERE year IS NOT NULL) y
		ORDER BY y.year DESC;
	`;

	const stages = await sql`
		SELECT
			id,
			display_name AS "displayName"
		FROM stages
		ORDER BY rank_order ASC;`;

	const medals = await sql`
		SELECT
			id,
			display_name AS "displayName"
		FROM medals
		ORDER BY rank_order DESC;
	`;

	res.render('year-index', { years, stages, medals });
});

app.get('/year/:year', async (req, res) => {
	const year = req.params.year;

	const delegates = await sql`
		SELECT
			s.full_name as "studentFullName",
			s.slug AS "studentSlug",
			sub.display_name AS "subjectName",
			stg.display_name AS "stageName",
			stg.id AS "stageId",
			d.year,
			d.rank,
			d.medal_id AS "medalId",
			m.display_name AS "medal"
		FROM delegates d
		JOIN students s ON d.student_id = s.id
		JOIN subjects sub ON d.subject_id = sub.id
		JOIN stages stg ON d.stage_id = stg.id
		LEFT JOIN medals m ON d.medal_id = m.id
		WHERE d.year = ${year}
		ORDER BY sub.display_name ASC, stg.rank_order DESC, d.rank ASC;
	`;

	const stagedDelegates = {};
	const stages = await sql`
		SELECT
			id,
			display_name AS "displayName"
		FROM stages
		ORDER BY rank_order DESC;
	`;

	for (const stage of stages)
		stagedDelegates[stage.id] = delegates.filter(delegate => delegate.stageId == stage.id);

	res.render('year', { year, stagedDelegates, stages });
});

//* Listen 
const PORT = Number(process.env.PORT || 3000);

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
	console.log('Server is ready! With port', PORT);
});