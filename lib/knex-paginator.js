var KnexQueryBuilder;
try {
  // this is the path of the query builder in the latest version of knexjs
  KnexQueryBuilder = require('knex/src/query/builder');
} catch(e) {
  // not found, let's revert to the old path of old version of knexjs
  KnexQueryBuilder = require('knex/lib/query/builder');
}

module.exports = function (knex) {
  KnexQueryBuilder.prototype.paginate = function (perPage = 10, page = 1) {
    let paginator = {};
    perPage = parseInt(perPage);
    page = parseInt(page);

    if (isNaN(perPage)) {
      throw new Error('Paginator error: perPage must be a number.');
    }

    if (isNaN(page)) {
      throw new Error('Paginator error: page must be an number.');
    }

    if (page < 1) {
      page = 1;
    }

    const offset = (page - 1) * perPage;
    let promises = [];

    promises.push(this.clone().clearSelect().clearOrder().count('* as total').first());

    // This will paginate the data itself
    promises.push(this.offset(offset).limit(perPage));

    return Promise.all(promises).then(([countQuery, result]) => {
      const total = countQuery.total;
      const total_pages = Math.ceil(total / perPage);

      const next_page = (page == total_pages)? null : page + 1;
      const prev_page = (page == 1)? null : page - 1;

      paginator = {
        paginate_meta:{
        per_page: perPage,
        current_page: page,
        next_page: next_page,
        prev_page: prev_page,
        total_count: total,
        total_pages: total_pages,
        from: offset,
        to: offset + result.length},
        data: result
      }
      return paginator;
    });
  }

  knex.queryBuilder = function queryBuilder() {
    return new KnexQueryBuilder(knex.client);
  }
}